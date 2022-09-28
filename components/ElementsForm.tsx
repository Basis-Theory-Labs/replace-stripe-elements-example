import React, { useState, FC, useRef } from 'react'

import CustomDonationInput from '../components/CustomDonationInput'
import StripeTestCards from '../components/StripeTestCards'
import PrintObject from '../components/PrintObject'

import { fetchPostJSON } from '../utils/api-helpers'
import {
  formatAmountForDisplay,
} from '../utils/stripe-helpers'
import * as config from '../config'

import { useBasisTheory, CardElement } from '@basis-theory/basis-theory-react';
import type { Token } from '@basis-theory/basis-theory-js/types/models';

const ElementsForm: FC = () => {
  const defaultAmount = Math.round(config.MAX_AMOUNT / config.AMOUNT_STEP)
  const [input, setInput] = useState({
    customDonation: defaultAmount,
    cardholderName: '',
  })
  const [payment, setPayment] = useState({ status: 'initial' })
  const [errorMessage, setErrorMessage] = useState('')
  
  const { bt } = useBasisTheory();
  const cardRef = useRef(null);

  const PaymentStatus = ({ status }: { status: string }) => {
    switch (status) {
      case 'processing':
      case 'requires_payment_method':
      case 'requires_confirmation':
        return <h2>Processing...</h2>

      case 'requires_action':
        return <h2>Authenticating...</h2>

      case 'succeeded':
        return <h2>Payment Succeeded 🥳</h2>

      case 'error':
        return (
          <>
            <h2>Error 😭</h2>
            <p className="error-message">{errorMessage}</p>
          </>
        )

      default:
        return null
    }
  }

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
    setInput({
      ...input,
      [e.currentTarget.name]: e.currentTarget.value,
    })

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    // Abort if form isn't valid
    if (!e.currentTarget.reportValidity()) return
    if (!bt) return
    setPayment({ status: 'processing' })

    // create the Basis Theory Token
    let token: Token | undefined;
    try {
      token = await bt.tokens.create({
        type: 'card',
        data: cardRef.current,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown Error');
      // eslint-disable-next-line no-console
      console.error(error);
    }

    if (token) {
      // Charge the card using our API
      const response = await fetchPostJSON('/api/charge_with_reactor', {
        token,
        amount: input.customDonation
      })
      setPayment(response)

      if (response.statusCode === 500) {
        setPayment({ status: 'error' })
        setErrorMessage(response.message)
        return
      }
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <CustomDonationInput
          className="elements-style"
          name="customDonation"
          value={input.customDonation}
          min={config.MIN_AMOUNT}
          max={config.MAX_AMOUNT}
          step={config.AMOUNT_STEP}
          currency={config.CURRENCY}
          onChange={handleInputChange}
        />
        <StripeTestCards />
        <fieldset className="elements-style">
          <legend>Your payment details:</legend>
          <input
            placeholder="Cardholder name"
            className="elements-style"
            type="Text"
            name="cardholderName"
            onChange={handleInputChange}
            required
          />
          <div className="FormRow elements-style">
            <CardElement
              id="card-element"
              ref={cardRef}
            />
          </div>
        </fieldset>
        <button
          className="elements-style-background"
          type="submit"
          disabled={
            !['initial', 'succeeded', 'error'].includes(payment.status) ||
            !bt
          }
        >
          Donate {formatAmountForDisplay(input.customDonation, config.CURRENCY)}
        </button>
      </form>
      <PaymentStatus status={payment.status} />
      <PrintObject content={payment} />
    </>
  )
}

export default ElementsForm
