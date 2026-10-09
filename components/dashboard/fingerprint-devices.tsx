"use client"

/**
 * Settings panel for fingerprint attendance devices. Shows whether any device
 * is connected, lets the admin add one, and gives the setup values to enter
 * on the device.
 */

import { useCallback, useEffect, useState } from "react"
import { Fingerprint, Plus, Trash2, Copy, Wifi, WifiOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

interface DeviceInfo {
  id: string
  name: string
  type: "zkteco" | "http"
  serialNumber?: string
  lastSeenAt?: string
  lastPunchAt?: string
  punchCount: number
  status: "waiting" | "online" | "offline"
}

function timeAgo(value?: string): string {
  if (!value) return "never"
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return hours < 48 ? `${hours} h ago` : new Date(value).toLocaleDateString()
}

export function FingerprintDevices({ canManage }: { canManage: boolean }) {
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", type: "zkteco" as "zkteco" | "http", serialNumber: "" })
  const [newToken, setNewToken] = useState("")

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/devices")
      setDevices(data.devices)
    } catch {
      setDevices([])
    }
  }, [])

  useEffect(() => {
    load()
    // Keep the status fresh while the page is open, e.g. while setting up a device
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const serverHost = typeof window !== "undefined" ? window.location.host : ""
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  const addDevice = async () => {
    setSaving(true)
    try {
      const data = await apiFetch("/api/devices", { method: "POST", body: JSON.stringify(form) })
      setNewToken(data.token || "")
      setAdding(false)
      setForm({ name: "", type: "zkteco", serialNumber: "" })
      await load()
      toast({ title: "Device added", description: "Follow the setup steps below on the device." })
    } catch (err) {
      toast({ variant: "destructive", title: "Could not add device", description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const removeDevice = async (device: DeviceInfo) => {
    if (!confirm(`Remove ${device.name}? It will stop being able to record attendance.`)) return
    try {
      await apiFetch(`/api/devices/${device.id}`, { method: "DELETE" })
      await load()
    } catch (err) {
      toast({ variant: "destructive", title: "Could not remove device", description: err instanceof Error ? err.message : undefined })
    }
  }

  const copy = (value: string) => {
    navigator.clipboard.writeText(value)
    toast({ title: "Copied" })
  }

  const connected = devices?.some((d) => d.status === "online" || d.punchCount > 0)

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Fingerprint className="w-5 h-5" />
        Fingerprint Devices
      </h3>

      {devices === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : devices.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="font-medium text-gray-900">No fingerprint device connected</p>
          <p className="text-sm text-gray-600 mt-1">
            Fingerprint check-in uses a fingerprint attendance terminal (for example a ZKTeco device with ADMS /
            cloud server support). Staff enrol their finger on the device, and every punch is recorded here as a
            check-in or check-out. Add your device once you have one — it starts working as soon as it connects.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {!connected && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Your device hasn&apos;t connected yet. Check its server settings using the values below.
            </p>
          )}
          {devices.map((device) => (
            <div key={device.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                  {device.name}
                  {device.status === "online" && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <Wifi className="w-3 h-3" /> Online
                    </span>
                  )}
                  {device.status === "offline" && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      <WifiOff className="w-3 h-3" /> Offline
                    </span>
                  )}
                  {device.status === "waiting" && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Waiting for first connection
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {device.type === "zkteco" ? `ZKTeco · SN ${device.serialNumber}` : "HTTP device"} · last seen{" "}
                  {timeAgo(device.lastSeenAt)} · {device.punchCount} punch{device.punchCount === 1 ? "" : "es"}
                </div>
              </div>
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => removeDevice(device)} title="Remove device">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {newToken && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
          <p className="text-sm font-medium text-blue-900">Device token (shown only once)</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-white border rounded px-2 py-1.5 break-all">{newToken}</code>
            <Button size="sm" variant="outline" onClick={() => copy(newToken)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-blue-800">
            The device sends <code>POST {origin}/api/devices/punch</code> with header{" "}
            <code>Authorization: Bearer &lt;token&gt;</code> and body{" "}
            <code>{`{"pin": "337724"}`}</code>.
          </p>
        </div>
      )}

      {canManage &&
        (adding ? (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="device-name">Name</Label>
                <Input
                  id="device-name"
                  placeholder="e.g. Front entrance"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="device-type">Type</Label>
                <select
                  id="device-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "zkteco" | "http" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="zkteco">ZKTeco (ADMS / cloud server)</option>
                  <option value="http">Other device (HTTP API)</option>
                </select>
              </div>
            </div>
            {form.type === "zkteco" && (
              <div className="space-y-1">
                <Label htmlFor="device-sn">Serial number</Label>
                <Input
                  id="device-sn"
                  placeholder="Menu → System Info → Device Info → Serial Number"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={addDevice} disabled={saving || !form.name.trim()}>
                {saving ? "Adding…" : "Add device"}
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add fingerprint device
          </Button>
        ))}

      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-700">How to connect a ZKTeco device</summary>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Add the device above with its serial number.</li>
          <li>
            On the device: <strong>Menu → COMM → Cloud Server Setting</strong> (sometimes &quot;ADMS&quot;). Set the server
            address to <code className="bg-gray-100 px-1 rounded">{serverHost.split(":")[0]}</code>, port{" "}
            <code className="bg-gray-100 px-1 rounded">{serverHost.split(":")[1] || "80"}</code>, and turn the proxy off.
          </li>
          <li>
            Enrol each staff member&apos;s finger on the device using their <strong>device PIN</strong> as the user ID
            (shown on the Staff page).
          </li>
          <li>Within a minute the device shows as Online here, and punches appear in Attendance.</li>
        </ol>
      </details>
    </div>
  )
}
