/*
 * Role-based authentication (mock).
 *
 * Login flow:  email + password  →  (staff only) MFA code  →  role home.
 * The role comes from the account, never from what the user picks, so a
 * patient can't open /doctor by typing the URL — RequireRole blocks it.
 *
 * To go live: replace `signIn` with supabase.auth.signInWithPassword and
 * read the role from `user_metadata.role` (same as the mobile app/backend).
 */
import { createContext, useContext, useMemo, useState } from 'react'
import { db } from '../lib/store.js'
import { DEMO_OTP, DEMO_PASSWORD } from '../data/seed.js'
import { ROLES } from '../config/roles.js'

const SESSION_KEY = 'hc-web-session'
const AuthContext = createContext(null)

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null
  } catch {
    return null
  }
}

function writeSession(s) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  const value = useMemo(() => {
    const set = (s) => {
      writeSession(s)
      setSession(s)
    }

    return {
      user: session?.mfaPending ? null : session?.user ?? null,
      pending: session?.mfaPending ? session.user : null,

      /* Returns { next: 'mfa' | 'pending' | 'home', user } or throws. */
      signIn(email, password) {
        const account = db
          .get('accounts')
          .find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
        if (!account || (password !== DEMO_PASSWORD && password !== account.password)) {
          throw new Error('Incorrect email or password.')
        }
        if (account.status === 'SUSPENDED') {
          throw new Error('This account is suspended. Contact support@healthchatter.ng.')
        }
        if (account.status === 'PENDING_VERIFICATION') {
          set({ user: account, mfaPending: false, limited: true })
          return { next: 'pending', user: account }
        }
        if (ROLES[account.role]?.mfa) {
          set({ user: account, mfaPending: true })
          return { next: 'mfa', user: account }
        }
        set({ user: account, mfaPending: false })
        return { next: 'home', user: account }
      },

      verifyMfa(code) {
        if (!session?.mfaPending) throw new Error('No sign-in in progress.')
        if (code !== DEMO_OTP) throw new Error('That code is not correct.')
        set({ user: session.user, mfaPending: false })
        return session.user
      },

      signUp(data) {
        const exists = db.get('accounts').some((a) => a.email.toLowerCase() === data.email.toLowerCase())
        if (exists) throw new Error('An account with this email already exists.')
        const account = db.add('accounts', data)
        if (account.status === 'PENDING_VERIFICATION') {
          db.add('verifications', {
            name: account.name,
            role: account.role,
            regulator: ROLES[account.role]?.regulator ?? 'Facility registration',
            license: account.license,
            specialty: account.specialty ?? '—',
            submitted: new Date().toISOString(),
            docs: ['Uploaded licence', 'Government ID'],
            registryMatch: true,
            status: 'PENDING',
          })
        }
        set({ user: account, mfaPending: false })
        return account
      },

      updateUser(patch) {
        if (!session?.user) return
        db.update('accounts', session.user.id, patch)
        set({ ...session, user: { ...session.user, ...patch } })
      },

      signOut() {
        set(null)
      },
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
