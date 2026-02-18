"use client"

import { LoginForm } from "@/components/auth/login-form"
import { Shield, Target, Zap, BookOpen } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Side - Brand Showcase (desktop only, compact on mobile) */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/10 to-primary/5 p-8 lg:flex lg:p-12">
        {/* Decorative overlays */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--primary)/0.05_0px,transparent_50%)]" />
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative z-10 max-w-xl space-y-8">
          {/* Logo and branding */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-primary/10 p-4 backdrop-blur-sm">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              Penethodix
            </h1>
            <p className="text-xl text-muted-foreground">
              Your Pentest Notebook, <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-semibold">Supercharged</span>
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid gap-4">
            {[
              {
                icon: Target,
                title: "Phase-Aware Tracking",
                description: "Automatically adapt to your engagement phase",
              },
              {
                icon: Zap,
                title: "Real-Time Sync",
                description: "Your data, synced across all devices instantly",
              },
              {
                icon: BookOpen,
                title: "Hierarchical Knowledge Base",
                description: "Organize findings like a pro with CherryTree-style structure",
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card/30 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-12">
        {/* Mobile: Compact header */}
        <div className="w-full max-w-md space-y-8">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 p-3 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Penethodix</h1>
            <p className="mt-2 text-sm text-muted-foreground">Penetration Testing Notebook</p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
