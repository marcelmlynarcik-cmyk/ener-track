'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const signIn = async () => supabase.auth.signInWithPassword({ email, password })
    const signUp = async () => supabase.auth.signUp({ email, password })

    const { error } = isSigningUp ? await signUp() : await signIn()

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 rounded-lg shadow-lg border">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          {isSigningUp ? 'Vytvoriť účet' : 'Prihlásiť sa'}
        </h2>
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div>
            <Label htmlFor="email">Emailová adresa</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="zadajte svoj email"
            />
          </div>
          <div>
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="zadajte svoje heslo"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Spracúvam...' : isSigningUp ? 'Registrovať sa' : 'Prihlásiť sa'}
          </Button>
        </form>

        <div className="text-center text-sm">
          {isSigningUp ? (
            <p>
              Už máte účet?{' '}
              <Button variant="link" onClick={() => setIsSigningUp(false)}>
                Prihláste sa
              </Button>
            </p>
          ) : (
            <p>
              Nemáte účet?{' '}
              <Button variant="link" onClick={() => setIsSigningUp(true)}>
                Zaregistrujte sa
              </Button>
            </p>
          )}
          <Link href="/" className="block mt-4 text-primary">
            Návrat na domovskú stránku
          </Link>
        </div>
      </div>
    </div>
  )
}
