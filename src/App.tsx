import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import "./App.css"

type Host = {
  id: number
  name: string
  ip: string
  protocol: string
  username?: string
  password?: string
}

export default function App() {
  const [hosts, setHosts] = useState<Host[]>([])
  const [tabs, setTabs] = useState<Host[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const activeTab = tabs.find((t) => t.id === activeId)

  const refresh = () => {
    invoke<Host[]>("get_host_list").then(setHosts)
  }

  const openTab = (conn: Host) => {
    if (!tabs.find((t) => t.ip === conn.ip)) {
      setTabs([...tabs, conn])
    }
    setActiveId(conn.id)
  }

  const closeTab = (id: number) => {
    const remaining = tabs.filter((t) => t.id !== id)
    setTabs(remaining)
    if (activeId === id) {
      setActiveId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="h-screen w-screen flex text-sm bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <div className="w-64 p-2 border-r border-gray-300 bg-gray-50 flex flex-col">
        <h2 className="text-md font-bold mb-2">Hosts</h2>
        <div className="flex-1 space-y-1 overflow-auto">
          {hosts.map((host) => (
            <div
              key={host.ip}
              className="px-3 py-2 bg-white border rounded hover:bg-blue-50 flex justify-between items-center"
            >
              <div onClick={() => openTab(host)} className="cursor-pointer">
                <div className="font-semibold">{host.name}</div>
                <div className="text-xs text-gray-600">{host.protocol} – {host.ip}</div>
              </div>
              <button
                onClick={() => {
                  invoke("delete_host", { id: host.id }).then(refresh)
                }}
                className="ml-2 text-red-500 hover:text-red-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.ip}
              onClick={() => setActiveId(tab.id)}
              className={`px-4 py-2 flex items-center gap-2 border-r cursor-pointer ${
                activeId === tab.id ? "bg-white font-semibold" : "hover:bg-gray-200"
              }`}
            >
              <span>{tab.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Session view */}
        <div className="p-6 overflow-auto flex-1">
          {activeTab ? (
            <div className="border rounded-lg bg-white p-6 shadow">
              <h3 className="text-xl font-bold mb-2">{activeTab.name}</h3>
              <p className="text-gray-700 mb-1">Protocol: {activeTab.protocol}</p>
              <p className="text-gray-700">IP: {activeTab.ip}</p>
              ...
            </div>
          ) : (
            <div className="text-gray-400 text-center pt-20">No session open</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onAdded={() => {
            refresh()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

function Modal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("")
  const [ip, setIp] = useState("")
  const [protocol, setProtocol] = useState("SSH")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const submit = async () => {
    if (!name || !ip) return
    await invoke("add_host", {
      newHost: {
        id: Date.now(),
        name,
        ip,
        protocol,
        username: username || null,
        password: password || null,
      },
    })
    onAdded()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-lg font-bold">Add Connection</h2>
        <input className="w-full border rounded p-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="IP Address" value={ip} onChange={(e) => setIp(e.target.value)} />
        <select className="w-full border rounded p-2" value={protocol} onChange={(e) => setProtocol(e.target.value)}>
          <option value="SSH">SSH</option>
          <option value="VNC">VNC</option>
          <option value="HTTP">HTTP</option>
          <option value="HTTPS">HTTPS</option>
        </select>
        <input className="w-full border rounded p-2" placeholder="Username (optional)" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Password (optional)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button onClick={submit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">Add</button>
        </div>
      </div>
    </div>
  )
}
