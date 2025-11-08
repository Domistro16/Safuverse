import React, { useState, useEffect } from 'react'
import { closePaymentModal, FlutterWaveButton } from 'flutterwave-react-v3'
import { fetchPaymentIntent, PaymentIntent } from '../hooks/payment'
import {
  FlutterwaveConfig,
  FlutterWaveResponse,
} from 'flutterwave-react-v3/dist/types'
import { useNavigate } from 'react-router-dom'

type RegisterParams = {
  domain: string
  duration: number
  resolver: `0x${string}`
  data: `0x${string}`[]
  reverseRecord: boolean
  ownerControlledFuses: number
  lifetime: boolean
  referree: string
}

type Props = {
  registerparams: RegisterParams
  userEmail: string
  currency: string
  walletAddress: `0x${string}`
}

export const DomainMint: React.FC<Props> = ({
  registerparams,
  userEmail,
  currency,
  walletAddress,
}) => {
  const [loading, setLoading] = useState(true)
  const [intent, setIntent] = useState<PaymentIntent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const duration = registerparams.duration

  useEffect(() => {
    setLoading(true)
    fetchPaymentIntent(registerparams.domain, duration, currency)
      .then((i) => {
        if (i) {
          setIntent(i)
          setLoading(false)
        }
      })
      .catch((e) => {
        console.error(e)
        setError('Could not fetch payment intent')
        setLoading(false)
      })
  }, [registerparams.domain, duration, currency])

  if (loading) {
    return <button disabled>Loading…</button>
  }
  if (error || !intent) {
    return <button disabled>{error ?? 'Error'}</button>
  }

  const config: FlutterwaveConfig = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_KEY!,
    tx_ref: intent.txRef,
    amount: intent.amount,
    currency: intent.currency,
    payment_options: 'card, ussd, mobilemoney',
    customer: {
      email: userEmail,
      name: '',
      phone_number: '',
    },
    meta: {
      registerparams: JSON.stringify(registerparams),
      duration,
      ts: intent.ts,
      hash: intent.hash,
      walletAddress,
    },
    customizations: {
      title: `Mint “${registerparams.domain}.safu”`,
      description: `${registerparams.duration} registration`,
      logo: 'https://our-site.com/logo.png',
    },
  }

  const fwConfig = {
    ...config,
    text: `Pay ${intent.currency} ${intent.amount} to Mint`,
    callback: async (response: FlutterWaveResponse) => {
      if (response.status === 'completed') {
        alert('Payment submitted! Waiting for blockchain mint…')
      } else {
        alert('Payment not completed.')
      }
      closePaymentModal()
      navigate('/')
      // optionally: show a toast that “Payment submitted — awaiting mint”
    },
    onClose: () => {
      // user closed the modal
    },
  }

  return (
    <FlutterWaveButton
      {...fwConfig}
      className="bg-[#FFB000] p-2 rounded-xl font-semibold cursor-pointer"
    />
  )
}
