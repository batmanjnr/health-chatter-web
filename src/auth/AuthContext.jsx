/*
 * Authentication — real Supabase accounts, shared with the mobile app.
 *
 * Login flow:  email + password (Supabase)  →  account + role from our own
 * database (GET /web/me)  →  (staff only) two-step code  →  role home.
 *
 * The role always comes from the database, never from what the user picks or
 * from Supabase metadata, so nobody can give themselves a different role.
 * RequireRole then blocks every area that doesn't belong to that role.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { api } from '../lib/api.js'
import { db } from '../lib/store.js'
import { ROLES } from '../config/roles.js'

// TODO(security): replace with Supabase MFA (TOTP) enrolment. Until then the
// staff second step accepts this fixed code.
export const MFA_CODE = '123456'
const MFA_KEY = 'hc-mfa-ok'

const AuthContext = createContext(null)

const mfaDone = (id) => {
  try {
    return sessionStorage.getItem(MFA_KEY) === id
  } catch {
    return false
  }
}
const setMfaDone = (id) => {
  try {
    if (id) sessionStorage.setItem(MFA_KEY, id)
    else sessionStorage.removeItem(MFA_KEY)
  } catch {
    /* ignore */
  }
}

// Valid values for the backend's health profile (same as the mobile app).
const HP_GENOTYPES = ['AA', 'AS', 'SS', 'AC']
const HP_BLOOD = ['O+', 'A+', 'B+', 'AB+']

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mfaOk, setMfaOk] = useState(false)

  // Restore the session on page load and follow sign-outs from other tabs.
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try {
          const me = await api('/web/me')
          if (!cancelled) {
            setAccount(me)
            setMfaOk(mfaDone(me.id))
          }
        } catch {
          await supabase.auth.signOut()
        }
      }
      if (!cancelled) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAccount(null)
        setMfaOk(false)
        db.reset()
      }
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    const needsMfa = account && ROLES[account.role]?.mfa && account.status === 'ACTIVE' && !mfaOk

    return {
      loading,
      user: account && !needsMfa ? account : null,
      pending: needsMfa ? account : null,

      /* Resolves { next: 'mfa' | 'pending' | 'home', user } or throws. */
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
          throw new Error(/invalid login/i.test(error.message) ? 'Incorrect email or password.' : error.message)
        }
        let me
        try {
          me = await api('/web/me')
        } catch (err) {
          await supabase.auth.signOut()
          throw err
        }
        db.reset()
        setAccount(me)
        if (me.status === 'PENDING_VERIFICATION') return { next: 'pending', user: me }
        if (ROLES[me.role]?.mfa && !mfaDone(me.id)) {
          setMfaOk(false)
          return { next: 'mfa', user: me }
        }
        setMfaOk(true)
        return { next: 'home', user: me }
      },

      verifyMfa(code) {
        if (!account) throw new Error('No sign-in in progress.')
        if (code !== MFA_CODE) throw new Error('That code is not correct.')
        setMfaDone(account.id)
        setMfaOk(true)
        return account
      },

      /*
       * Creates the Supabase login. The backend creates the matching account
       * on first sign-in from these details (patients become active, everyone
       * else waits for licence verification).
       * Resolves the account, or { confirmEmail: true } when Supabase needs
       * the email confirmed before the first sign-in.
       */
      async signUp(data) {
        const { data: res, error } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              role: data.role,
              name: data.name,
              phone: data.phone,
              license: data.license,
              specialty: data.specialty,
              facility: data.facility,
            },
          },
        })
        if (error) throw new Error(error.message)
        if (!res.session) return { confirmEmail: true }

        const me = await api('/web/me')
        if (me.role === 'PATIENT' && data.healthProfile) {
          const hp = data.healthProfile
          await api('/patients/me/health-profile', {
            method: 'PUT',
            body: {
              ...(hp.dateOfBirth && { dateOfBirth: hp.dateOfBirth }),
              ...(hp.gender && { gender: hp.gender }),
              ...(hp.state && { state: hp.state }),
              ...(HP_GENOTYPES.includes(hp.genotype) && { genotype: hp.genotype }),
              ...(HP_BLOOD.includes(hp.bloodGroup) && { bloodGroup: hp.bloodGroup }),
              ...(hp.coverageType && { coverageType: hp.coverageType }),
              ...(hp.policyId && { policyId: hp.policyId }),
            },
          }).catch((err) => console.error('Health profile not saved', err))
        }
        db.reset()
        setAccount(me)
        setMfaOk(true) // just created the password — no second step this session
        return me
      },

      /* Creates the account (server side) and emails the person a link to set
       * their password on /accept-invite. */
      async inviteUser({ name, email, role, facility, specialty }) {
        await api('/web/collections/accounts', { method: 'POST', body: { name, email, role, facility, specialty } })
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/accept-invite`,
        })
        if (error) throw new Error(`Account created, but the invite email failed: ${error.message}`)
      },

      async setPassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw new Error(error.message)
        if (account) setMfaDone(account.id)
        setMfaOk(true)
      },

      async sendPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        })
        if (error) throw new Error(error.message)
      },

      async updateUser(patch) {
        if (!account) return
        setAccount({ ...account, ...patch })
        try {
          setAccount(await api('/web/me', { method: 'PATCH', body: patch }))
        } catch (err) {
          setAccount(account)
          throw err
        }
      },

      async signOut() {
        setMfaDone(null)
        setAccount(null)
        setMfaOk(false)
        db.reset()
        await supabase.auth.signOut()
      },
    }
  }, [account, loading, mfaOk])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
