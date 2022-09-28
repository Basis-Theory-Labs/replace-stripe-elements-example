import { NextApiRequest, NextApiResponse } from 'next';
import { Stripe } from 'stripe';
import { BasisTheory } from '@basis-theory/basis-theory-js';
import type { Token } from '@basis-theory/basis-theory-js/types/models';

import { CURRENCY, MIN_AMOUNT, MAX_AMOUNT } from '../../../config'

const bt = new BasisTheory();
bt.init(process.env.BT_PRIVATE_API_KEY!);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2020-08-27',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
    return
  }

  const {
    amount,
    token,
  }: { amount: number; token: Token } = req.body
  // Validate the amount that was passed from the client.
  if (!(amount >= MIN_AMOUNT && amount <= MAX_AMOUNT)) {
    res.status(500).json({ statusCode: 400, message: 'Invalid amount.' })
    return
  }
  if (token) {
    try {
      const { raw } = await bt.reactors.react(process.env.BT_REACTOR_ID as string, {
        args: {
          card: `{{${token.id}}}`,
        },
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: CURRENCY,
        payment_method: raw.id as string,
        confirm: true,
      });

      res.status(200).json(paymentIntent);
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

