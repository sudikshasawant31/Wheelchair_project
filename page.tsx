"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Brain, Download, Play, Pause, Bluetooth } from "lucide-react"
import { MobilitySystemPanel } from "@/components/mobility/mobility-system-panel"
import { useTelemetry } from "@/contexts/telemetry-context"

interface EEGReading {
  timestamp: number
  attention: number
  meditation: number
  delta: number
  theta: number
  lowAlpha: number
  highAlpha: number
  lowBeta: number
  highBeta: number
  lowGamma: number
  highGamma: number
  rawEeg: number
  signalQuality: number
}

interface SignalVisualizationProps {
  name: string
  value: number
  maxValue: number
  color: string
  description: string
  history: number[]
}

function SignalVisualization({ name, value, maxValue, color, description, history }: SignalVisualizationProps) {
  const percentage = Math.min(100, (value / maxValue) * 100)
  const normalizedHistory = history.map((v) => Math.min(100, (v / maxValue) * 100))

  const hasRealData = history.length > 0 && history.some((v) => v > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{name}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Line Chart */}
          <div className="flex-1">
            <div className="h-16 bg-muted/20 rounded relative overflow-hidden">
              {hasRealData ? (
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={normalizedHistory
                      .map((val, idx) => `${(idx / (normalizedHistory.length - 1)) * 100},${100 - val}`)
                      .join(" ")}
                  />
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No Real Data
                </div>
              )}
            </div>
            <div className="font-data text-lg font-semibold mt-1" style={{ color: hasRealData ? color : "var(--muted-foreground)" }}>
              {hasRealData ? value.toLocaleString() : "---"}
            </div>
          </div>

          {/* Circular Gauge */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                className="stroke-border"
                strokeWidth="2"
              />
              {hasRealData && (
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray={`${percentage}, 100`}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-data text-xs font-semibold" style={{ color: hasRealData ? color : "var(--muted-foreground)" }}>
                {hasRealData ? Math.round(percentage) + "%" : "---"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EEGDashboard() {
  // Real hardware data path: the Python ThinkGear script (or the ESP32 it
  // forwards to) POSTs to /api/telemetry/ingest, and this context is the one
  // place in the app that subscribes to that stream. The Mobility panel
  // below already reads from this; the dashboard above did not, which is why
  // it stayed at 0%/"No Real Data" even with the Python script running.
  const { telemetry } = useTelemetry()
  const hardwareEegActive = telemetry.connected && telemetry.eegAttention != null

  const [currentReading, setCurrentReading] = useState<EEGReading | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<EEGReading[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [duration, setDuration] = useState("00:00:00")
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null)

  const [signalHistory, setSignalHistory] = useState<{
    [key: string]: number[]
  }>({
    lowAlpha: [],
    highAlpha: [],
    lowBeta: [],
    highBeta: [],
    lowGamma: [],
    highGamma: [],
    delta: [],
    theta: [],
  })

  const parseThinkGearData = (dataView: DataView): Partial<EEGReading> | null => {
    try {
      const data: Partial<EEGReading> = {
        timestamp: Date.now(),
        signalQuality: 0,
      }

      let index = 0
      while (index < dataView.byteLength) {
        const code = dataView.getUint8(index++)

        switch (code) {
          case 0x02: // Signal Quality
            data.signalQuality = dataView.getUint8(index++)
            break
          case 0x04: // Attention
            data.attention = dataView.getUint8(index++)
            break
          case 0x05: // Meditation
            data.meditation = dataView.getUint8(index++)
            break
          case 0x83: // EEG Power (8 bands)
            if (index + 24 <= dataView.byteLength) {
              data.delta =
                (dataView.getUint8(index) << 16) | (dataView.getUint8(index + 1) << 8) | dataView.getUint8(index + 2)
              data.theta =
                (dataView.getUint8(index + 3) << 16) |
                (dataView.getUint8(index + 4) << 8) |
                dataView.getUint8(index + 5)
              data.lowAlpha =
                (dataView.getUint8(index + 6) << 16) |
                (dataView.getUint8(index + 7) << 8) |
                dataView.getUint8(index + 8)
              data.highAlpha =
                (dataView.getUint8(index + 9) << 16) |
                (dataView.getUint8(index + 10) << 8) |
                dataView.getUint8(index + 11)
              data.lowBeta =
                (dataView.getUint8(index + 12) << 16) |
                (dataView.getUint8(index + 13) << 8) |
                dataView.getUint8(index + 14)
              data.highBeta =
                (dataView.getUint8(index + 15) << 16) |
                (dataView.getUint8(index + 16) << 8) |
                dataView.getUint8(index + 17)
              data.lowGamma =
                (dataView.getUint8(index + 18) << 16) |
                (dataView.getUint8(index + 19) << 8) |
                dataView.getUint8(index + 20)
              data.highGamma =
                (dataView.getUint8(index + 21) << 16) |
                (dataView.getUint8(index + 22) << 8) |
                dataView.getUint8(index + 23)
              index += 24
            }
            break
          case 0x80: // Raw EEG (2 bytes)
            if (index + 2 <= dataView.byteLength) {
              data.rawEeg = dataView.getInt16(index, false) // Big endian
              index += 2
            }
            break
          default:
            index++
            break
        }
      }

      return Object.keys(data).length > 1 ? data : null
    } catch (error) {
      console.error("Error parsing ThinkGear data:", error)
      return null
    }
  }

  const connectToMindwave = async () => {
    if (!navigator.bluetooth) {
      alert("Bluetooth is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.")
      return
    }

    setIsConnecting(true)
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "MindWave Mobile" }, { namePrefix: "MindWave" }, { namePrefix: "NeuroSky" }],
        optionalServices: [
          "0000ffe0-0000-1000-8000-00805f9b34fb", // NeuroSky service UUID
          "battery_service",
          "device_information",
        ],
      })

      setBluetoothDevice(device)
      const server = await device.gatt?.connect()

      if (server && server.connected) {
        try {
          // Connect to NeuroSky service
          const service = await server.getPrimaryService("0000ffe0-0000-1000-8000-00805f9b34fb")
          const char = await service.getCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb")

          setCharacteristic(char)

          // Start notifications for real-time data
          await char.startNotifications()
          char.addEventListener("characteristicvaluechanged", (event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic
            const dataView = target.value
            if (dataView) {
              const parsedData = parseThinkGearData(dataView)
              if (parsedData && Object.keys(parsedData).length > 2) {
                const reading: EEGReading = {
                  timestamp: parsedData.timestamp || Date.now(),
                  attention: parsedData.attention || 0,
                  meditation: parsedData.meditation || 0,
                  delta: parsedData.delta || 0,
                  theta: parsedData.theta || 0,
                  lowAlpha: parsedData.lowAlpha || 0,
                  highAlpha: parsedData.highAlpha || 0,
                  lowBeta: parsedData.lowBeta || 0,
                  highBeta: parsedData.highBeta || 0,
                  lowGamma: parsedData.lowGamma || 0,
                  highGamma: parsedData.highGamma || 0,
                  rawEeg: parsedData.rawEeg || 0,
                  signalQuality: parsedData.signalQuality || 0,
                }

                setCurrentReading(reading)

                setSignalHistory((prev) => ({
                  lowAlpha: [...prev.lowAlpha.slice(-49), reading.lowAlpha],
                  highAlpha: [...prev.highAlpha.slice(-49), reading.highAlpha],
                  lowBeta: [...prev.lowBeta.slice(-49), reading.lowBeta],
                  highBeta: [...prev.highBeta.slice(-49), reading.highBeta],
                  lowGamma: [...prev.lowGamma.slice(-49), reading.lowGamma],
                  highGamma: [...prev.highGamma.slice(-49), reading.highGamma],
                  delta: [...prev.delta.slice(-49), reading.delta],
                  theta: [...prev.theta.slice(-49), reading.theta],
                }))

                if (isRecording) {
                  setRecordings((prev) => [...prev, reading])
                }
              }
            }
          })

          setIsConnected(true)
          alert(`Successfully connected to ${device.name}! Real EEG data collection started.`)
        } catch (serviceError) {
          console.error("Failed to connect to NeuroSky service:", serviceError)
          alert(
            "Connected to the device, but it doesn't expose the expected Bluetooth LE data service. The standard NeuroSky MindWave Mobile uses classic Bluetooth (SPP), which Web Bluetooth cannot read from any browser — this is a platform limitation, not a problem with your headset. Use the Python ThinkGear script (posting to /api/telemetry/ingest) for real data instead; this button is optional.",
          )
          setIsConnected(false)
        }
      }

      device.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false)
        setBluetoothDevice(null)
        setCharacteristic(null)
        setCurrentReading(null)
        alert("NeuroSky device disconnected.")
      })
    } catch (error) {
      console.error("Bluetooth connection failed:", error)
      alert(
        "Couldn't pair directly with the headset from this browser (the NeuroSky MindWave Mobile uses classic Bluetooth, which Web Bluetooth can't access — this button is optional). If your Python ThinkGear script is posting to /api/telemetry/ingest, this entire dashboard — attention/meditation, band cards, raw signal, and the Mobility panel — will populate from that real data instead.",
      )
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectDevice = () => {
    if (characteristic) {
      characteristic.stopNotifications()
    }
    if (bluetoothDevice?.gatt?.connected) {
      bluetoothDevice.gatt.disconnect()
    }
    setIsConnected(false)
    setBluetoothDevice(null)
    setCharacteristic(null)
    setCurrentReading(null)
    // Clear all signal history when disconnecting
    setSignalHistory({
      lowAlpha: [],
      highAlpha: [],
      lowBeta: [],
      highBeta: [],
      lowGamma: [],
      highGamma: [],
      delta: [],
      theta: [],
    })
  }

  useEffect(() => {
    if (!isConnected) {
      setCurrentReading(null)
      return
    }

    const interval = setInterval(() => {
      // Placeholder for real-time data handling
    }, 100)

    return () => clearInterval(interval)
  }, [isConnected])

  // Mirror hardware telemetry (Python script -> ingest -> SSE) into the same
  // signalHistory/recordings state the BLE path uses, so the band cards,
  // sparklines, and CSV/JSON export all work off the real hardware feed too.
  useEffect(() => {
    if (!hardwareEegActive || !effectiveReading) return

    setSignalHistory((prev) => ({
      lowAlpha: [...prev.lowAlpha.slice(-49), effectiveReading.lowAlpha],
      highAlpha: [...prev.highAlpha.slice(-49), effectiveReading.highAlpha],
      lowBeta: [...prev.lowBeta.slice(-49), effectiveReading.lowBeta],
      highBeta: [...prev.highBeta.slice(-49), effectiveReading.highBeta],
      lowGamma: [...prev.lowGamma.slice(-49), effectiveReading.lowGamma],
      highGamma: [...prev.highGamma.slice(-49), effectiveReading.highGamma],
      delta: [...prev.delta.slice(-49), effectiveReading.delta],
      theta: [...prev.theta.slice(-49), effectiveReading.theta],
    }))

    if (isRecording) {
      setRecordings((prev) => [...prev, effectiveReading])
    }
    // Only re-run when a new telemetry timestamp actually arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry.timestamp, hardwareEegActive])

  useEffect(() => {
    if (!isRecording || !startTime) {
      setDuration("00:00:00")
      return
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setDuration(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isRecording, startTime])

  const startRecording = () => {
    if (!isConnected && !hardwareEegActive) {
      alert("Please connect to NeuroSky device first (or start your Python ThinkGear script)")
      return
    }
    setIsRecording(true)
    setStartTime(Date.now())
    setRecordings([])
  }

  const stopRecording = () => {
    setIsRecording(false)
    setStartTime(null)
  }

  const exportCSV = () => {
    if (recordings.length === 0) return

    const headers = [
      "timestamp",
      "attention",
      "meditation",
      "delta",
      "theta",
      "lowAlpha",
      "highAlpha",
      "lowBeta",
      "highBeta",
      "lowGamma",
      "highGamma",
      "rawEeg",
      "signalQuality",
    ]
    const csvContent = [
      headers.join(","),
      ...recordings.map((r) => headers.map((h) => r[h as keyof EEGReading]).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `eeg-data-${new Date().toISOString().slice(0, 19)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    if (recordings.length === 0) return

    const data = {
      session: {
        startTime: startTime,
        endTime: Date.now(),
        duration: duration,
        readingCount: recordings.length,
        device: bluetoothDevice?.name || "Unknown",
      },
      readings: recordings,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `eeg-session-${new Date().toISOString().slice(0, 19)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Prefer real hardware telemetry (Python script -> ingest -> SSE) over the
  // browser's own Web Bluetooth reading whenever hardware data is actually
  // flowing. Falls back to the Bluetooth-derived currentReading otherwise, so
  // the optional direct-BLE path still works if it ever does connect.
  const effectiveReading: EEGReading | null = hardwareEegActive
    ? {
        timestamp: telemetry.timestamp,
        attention: telemetry.eegAttention ?? 0,
        meditation: telemetry.eegMeditation ?? 0,
        delta: telemetry.eegDelta ?? 0,
        theta: telemetry.eegTheta ?? 0,
        lowAlpha: telemetry.eegLowAlpha ?? 0,
        highAlpha: telemetry.eegHighAlpha ?? 0,
        lowBeta: telemetry.eegLowBeta ?? 0,
        highBeta: telemetry.eegHighBeta ?? 0,
        lowGamma: telemetry.eegLowGamma ?? 0,
        highGamma: telemetry.eegHighGamma ?? 0,
        rawEeg: telemetry.eegRaw ?? 0,
        signalQuality: telemetry.eegSignalQuality ?? 0,
      }
    : currentReading

  const effectiveConnected = isConnected || hardwareEegActive

  const signalBands = [
    {
      name: "Low Alpha",
      key: "lowAlpha" as keyof EEGReading,
      value: effectiveReading?.lowAlpha || 0,
      color: "#3b82f6",
      description: "8-10 Hz - Relaxed awareness",
      maxValue: 50000,
    },
    {
      name: "High Alpha",
      key: "highAlpha" as keyof EEGReading,
      value: effectiveReading?.highAlpha || 0,
      color: "#1d4ed8",
      description: "10-12 Hz - Calm focus",
      maxValue: 50000,
    },
    {
      name: "Low Beta",
      key: "lowBeta" as keyof EEGReading,
      value: effectiveReading?.lowBeta || 0,
      color: "#10b981",
      description: "12-16 Hz - Relaxed attention",
      maxValue: 30000,
    },
    {
      name: "High Beta",
      key: "highBeta" as keyof EEGReading,
      value: effectiveReading?.highBeta || 0,
      color: "#059669",
      description: "16-25 Hz - Active concentration",
      maxValue: 30000,
    },
    {
      name: "Low Gamma",
      key: "lowGamma" as keyof EEGReading,
      value: effectiveReading?.lowGamma || 0,
      color: "#f59e0b",
      description: "25-40 Hz - Cognitive processing",
      maxValue: 15000,
    },
    {
      name: "High Gamma",
      key: "highGamma" as keyof EEGReading,
      value: effectiveReading?.highGamma || 0,
      color: "#d97706",
      description: "40-100 Hz - High-level cognitive",
      maxValue: 15000,
    },
    {
      name: "Delta",
      key: "delta" as keyof EEGReading,
      value: effectiveReading?.delta || 0,
      color: "#ef4444",
      description: "0.5-4 Hz - Deep sleep",
      maxValue: 80000,
    },
    {
      name: "Theta",
      key: "theta" as keyof EEGReading,
      value: effectiveReading?.theta || 0,
      color: "#8b5cf6",
      description: "4-8 Hz - Deep meditation",
      maxValue: 60000,
    },
  ]

  const linkQuality = effectiveReading ? Math.max(0, 100 - effectiveReading.signalQuality) : 0
  const attentionPct = effectiveReading ? Math.round(effectiveReading.attention) : 0
  const meditationPct = effectiveReading ? Math.round(effectiveReading.meditation) : 0
  const R_OUTER = 58
  const R_INNER = 42
  const C_OUTER = 2 * Math.PI * R_OUTER
  const C_INNER = 2 * Math.PI * R_INNER

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Instrument bar */}
      <header className="sticky top-0 z-20 glass-strong border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-neural/15 glow-neural">
                <Brain className="h-5 w-5 text-neural" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold tracking-tight text-foreground leading-tight">
                  Aegis Mobility
                </h1>
                <p className="text-xs text-muted-foreground leading-tight">
                  Assistive BCI Platform · EEG + Full Autonomy Stack
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={effectiveConnected ? "safe" : "crit"} className="font-data">
                <span
                  className={`status-dot mr-1.5 h-1.5 w-1.5 rounded-full ${effectiveConnected ? "bg-safe" : "bg-crit"}`}
                />
                {effectiveConnected ? "LINK ACTIVE" : "LINK DOWN"}
              </Badge>
              {effectiveReading && (
                <Badge variant="vital" className="font-data hidden sm:inline-flex">
                  SIGNAL {linkQuality}%
                </Badge>
              )}
              {hardwareEegActive && (
                <Badge variant="outline" className="hidden md:inline-flex">
                  Hardware feed (Python script)
                </Badge>
              )}
              {bluetoothDevice && (
                <Badge variant="outline" className="hidden md:inline-flex">
                  <Bluetooth className="h-3 w-3 mr-1" />
                  {bluetoothDevice.name}
                </Badge>
              )}
              <Button
                size="sm"
                className="bg-neural text-neural-foreground hover:bg-neural/90"
                onClick={connectToMindwave}
                disabled={isConnecting}
              >
                <Bluetooth className="h-4 w-4 mr-1" />
                {isConnecting ? "Connecting…" : bluetoothDevice ? "Connected" : "Connect"}
              </Button>
              {isConnected && (
                <Button variant="outline" size="sm" onClick={disconnectDevice}>
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6">
          {/* Hero: Neural-Vital Ring */}
          <Card className="overflow-hidden">
            <CardContent className="px-6">
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
                {/* Ring gauge — outer ring = attention (neural), inner ring = link quality (vital) */}
                <div className="relative shrink-0">
                  <svg width="180" height="180" viewBox="0 0 140 140" className="-rotate-90">
                    <circle cx="70" cy="70" r={R_OUTER} fill="none" strokeWidth="10"
                      className="stroke-neural/15" />
                    <circle
                      cx="70" cy="70" r={R_OUTER} fill="none" strokeWidth="10" strokeLinecap="round"
                      className="stroke-neural transition-all duration-500"
                      strokeDasharray={`${(attentionPct / 100) * C_OUTER} ${C_OUTER}`}
                    />
                    <circle cx="70" cy="70" r={R_INNER} fill="none" strokeWidth="10"
                      className="stroke-vital/15" />
                    <circle
                      cx="70" cy="70" r={R_INNER} fill="none" strokeWidth="10" strokeLinecap="round"
                      className="stroke-vital transition-all duration-500"
                      strokeDasharray={`${(linkQuality / 100) * C_INNER} ${C_INNER}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-data text-3xl font-semibold text-foreground">
                      {attentionPct}<span className="text-base text-muted-foreground">%</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Attention</span>
                  </div>
                </div>

                {/* Readouts */}
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-neural" /> Attention
                    </div>
                    <div className="font-data text-2xl font-semibold text-neural mt-1">{attentionPct}%</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-safe" /> Meditation
                    </div>
                    <div className="font-data text-2xl font-semibold text-safe mt-1">{meditationPct}%</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-vital" /> Link Quality
                    </div>
                    <div className="font-data text-2xl font-semibold text-vital mt-1">{linkQuality}%</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full ${isRecording ? "bg-warn" : "bg-muted-foreground"}`} /> Session
                    </div>
                    <div className="font-data text-2xl font-semibold mt-1">{duration}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Recording Control</CardTitle>
              <CardDescription>Start or stop EEG data collection and manage recording sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="bg-neural text-neural-foreground hover:bg-neural/90"
                  onClick={startRecording}
                  disabled={isRecording || !effectiveConnected}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
                <Button variant="outline" onClick={stopRecording} disabled={!isRecording}>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
                <Button variant="outline" onClick={exportCSV} disabled={recordings.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={exportJSON} disabled={recordings.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <div className="ml-auto font-data text-sm text-muted-foreground">Duration: {duration}</div>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Readings collected: <span className="font-data">{recordings.length}</span>
                {!effectiveConnected && (
                  <span className="block text-warn mt-1">
                    Connect to NeuroSky device (or start your Python ThinkGear script) to start collecting real data
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {signalBands.map((band) => (
              <SignalVisualization
                key={band.name}
                name={band.name}
                value={band.value}
                maxValue={band.maxValue}
                color={band.color}
                description={band.description}
                history={signalHistory[band.key as keyof typeof signalHistory] || []}
              />
            ))}
          </div>

          {/* Raw EEG Signal - Real data only */}
          <Card>
            <CardHeader>
              <CardTitle>Raw EEG Signal</CardTitle>
              <CardDescription>Unprocessed brainwave data from NeuroSky sensor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg p-4 flex items-center justify-center">
                {effectiveReading && effectiveConnected ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-px bg-muted-foreground/20"></div>
                      <div
                        className="absolute w-2 h-2 bg-neural rounded-full transition-all duration-100"
                        style={{
                          transform: `translateY(${(effectiveReading.rawEeg / 32768) * 50}px)`,
                        }}
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 font-data text-xs text-muted-foreground">
                      Raw: {Math.round(effectiveReading.rawEeg)} μV | Quality: {100 - effectiveReading.signalQuality}%
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No real EEG signal detected</p>
                    <p className="text-sm">Connect to NeuroSky device to see authentic brainwave data</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Smart Assistive Mobility System - integrated below EEG dashboard */}
          <div className="mt-2 pt-6 border-t border-border/60">
            <MobilitySystemPanel
              brainAttention={effectiveReading?.attention || 0}
              brainMeditation={effectiveReading?.meditation || 0}
              brainConnected={effectiveConnected}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
