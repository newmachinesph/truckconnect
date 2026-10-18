import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const phone = credentials?.phone as string | undefined
        const name = credentials?.name as string | undefined
        const hasEmail = !!email && email !== "undefined" && email.length > 0
        const hasPhone = !!phone && phone !== "undefined" && phone.length > 0

        if (!hasEmail && !hasPhone) return null

        const user = await prisma.user.findFirst({
          where: hasEmail ? { email } : { phone },
        })

        if (!user) {
          // Auto-create user for demo (in production, use proper signup flow)
          const displayName = name || (hasEmail ? email!.split("@")[0] : "User")
          const newUser = await prisma.user.create({
            data: {
              email: hasEmail ? email! : null,
              phone: hasPhone ? phone! : null,
              name: displayName,
            },
          })
          return { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
})
