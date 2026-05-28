import { useState } from 'react'
import { Modal, TextInput, Button, Text } from '@mantine/core'

const API_BASE = 'https://gsuarez.dev'

const modalStyles = {
  content: { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' },
  header:  { backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' },
  title:   { color: 'var(--text-primary)', fontSize: '1.1rem' },
  close:   { color: 'var(--text-muted)' },
  body:    { backgroundColor: 'var(--bg-card)' },
}

const inputStyles = {
  input: {
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border)',
  },
}

export default function ResumeModal({ opened, onClose }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setEmail('')
    setStatus(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ msg: 'Please enter a valid email address.', type: 'error' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch(`${API_BASE}/api/request-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus({ msg: 'Check your inbox for the download link.', type: 'success' })
        setEmail('')
      } else if (res.status === 429) {
        setStatus({ msg: 'A link was already sent to this address. Please check your inbox.', type: 'warning' })
      } else {
        setStatus({ msg: 'Something went wrong. Please try again.', type: 'error' })
      }
    } catch {
      setStatus({ msg: 'Something went wrong. Please try again.', type: 'error' })
    }

    setLoading(false)
  }

  const statusColor = { success: 'green', warning: 'yellow', error: 'red' }

  return (
    <Modal opened={opened} onClose={handleClose} title="Request Resume" centered styles={modalStyles}>
      <Text size="sm" c="dimmed" mb="md">Enter your email and I&apos;ll send you a download link.</Text>

      {status && (
        <Text size="sm" c={statusColor[status.type]} mb="sm">{status.msg}</Text>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <TextInput
          flex={1}
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          styles={inputStyles}
        />
        <Button
          onClick={handleSubmit}
          loading={loading}
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-page)', border: 'none' }}
        >
          Send Link
        </Button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outline" color="gray" size="sm" onClick={handleClose}>Close</Button>
      </div>
    </Modal>
  )
}
