"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Key, Mail, Shield, AlertTriangle, Save } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // General Settings
  const [trialDuration, setTrialDuration] = useState("14")
  const [maxTenantsInTrial, setMaxTenantsInTrial] = useState("100")

  // API Keys (masked for security)
  const [paystackSecret, setPaystackSecret] = useState("sk_test_***************")
  const [paystackPublic, setPaystackPublic] = useState("pk_test_***************")
  const [resendApiKey, setResendApiKey] = useState("re_***************")
  const [awsAccessKey, setAwsAccessKey] = useState("AKIA***************")
  const [awsSecretKey, setAwsSecretKey] = useState("***************")

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure platform settings and integrations
        </p>
      </div>

      {saved && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>
                Manage general platform settings and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="trial-duration">Trial Duration (days)</Label>
                <Input
                  id="trial-duration"
                  type="number"
                  value={trialDuration}
                  onChange={(e) => setTrialDuration(e.target.value)}
                  placeholder="14"
                />
                <p className="text-sm text-gray-500">
                  Default trial period for new organizations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tenants">Max Tenants in Trial</Label>
                <Input
                  id="max-tenants"
                  type="number"
                  value={maxTenantsInTrial}
                  onChange={(e) => setMaxTenantsInTrial(e.target.value)}
                  placeholder="100"
                />
                <p className="text-sm text-gray-500">
                  Maximum number of organizations that can be in trial simultaneously
                </p>
              </div>

              <div className="flex items-center justify-between border-t pt-6">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">
                    Prevent new signups and logins (except super admin)
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Paystack Integration
              </CardTitle>
              <CardDescription>
                Configure Paystack payment gateway credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paystack-secret">Secret Key</Label>
                <Input
                  id="paystack-secret"
                  type="password"
                  value={paystackSecret}
                  onChange={(e) => setPaystackSecret(e.target.value)}
                  placeholder="sk_test_..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paystack-public">Public Key</Label>
                <Input
                  id="paystack-public"
                  type="text"
                  value={paystackPublic}
                  onChange={(e) => setPaystackPublic(e.target.value)}
                  placeholder="pk_test_..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AWS Rekognition
              </CardTitle>
              <CardDescription>
                Face verification for attendance photo matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aws-access">AWS Access Key ID</Label>
                <Input
                  id="aws-access"
                  type="password"
                  value={awsAccessKey}
                  onChange={(e) => setAwsAccessKey(e.target.value)}
                  placeholder="AKIA..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aws-secret">AWS Secret Access Key</Label>
                <Input
                  id="aws-secret"
                  type="password"
                  value={awsSecretKey}
                  onChange={(e) => setAwsSecretKey(e.target.value)}
                  placeholder="..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save API Keys"}
            </Button>
          </div>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Service (Resend)
              </CardTitle>
              <CardDescription>
                Configure email delivery service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-key">Resend API Key</Label>
                <Input
                  id="resend-key"
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-email">From Email Address</Label>
                <Input
                  id="from-email"
                  type="email"
                  defaultValue="noreply@timewise.com"
                  placeholder="noreply@timewise.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  defaultValue="support@timewise.com"
                  placeholder="support@timewise.com"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Email Settings"}
            </Button>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="2fa">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">
                    Require 2FA for super admin login
                  </p>
                </div>
                <Switch id="2fa" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  defaultValue="60"
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jwt-secret">JWT Secret Key</Label>
                <Textarea
                  id="jwt-secret"
                  rows={3}
                  placeholder="Your JWT secret key"
                  className="font-mono text-sm"
                />
                <p className="text-sm text-gray-500">
                  Keep this secret safe. Changing it will log out all users.
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Changing security settings may affect all active sessions. Proceed with caution.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} variant="destructive">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Security Settings"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
