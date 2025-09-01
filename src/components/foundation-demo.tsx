'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function FoundationDemo() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Foundation Setup Complete</CardTitle>
          <CardDescription>
            TypeScript, Next.js, shadcn/ui, and Tailwind CSS are now configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Core Interfaces</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>✅ CognitiveAgent</li>
                  <li>✅ ConfigurationProfile</li>
                  <li>✅ ContextThread</li>
                  <li>✅ UserState & AgentState</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>✅ Next.js 14 with App Router</li>
                  <li>✅ TypeScript (strict mode)</li>
                  <li>✅ Tailwind CSS</li>
                  <li>✅ shadcn/ui components</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex gap-2">
            <Button>Primary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="secondary">Secondary Button</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}