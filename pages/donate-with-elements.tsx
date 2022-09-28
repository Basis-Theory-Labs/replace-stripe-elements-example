import { NextPage } from 'next'
import Layout from '../components/Layout'
import ElementsForm from '../components/ElementsForm'
import { BasisTheoryProvider, useBasisTheory } from '@basis-theory/basis-theory-react'

const DonatePage: NextPage = () => {
  const { bt } = useBasisTheory(process.env.NEXT_PUBLIC_BT_ELEMENTS_API_KEY!, {
    elements: true,
  });
  
  return (
    <Layout title="Donate with Elements | Next.js + TypeScript Example">
      <div className="page-container">
        <h1>Donate with Elements</h1>
        <p>Donate to our project 💖</p>
        {bt ? (
          <BasisTheoryProvider bt={bt}>
            <ElementsForm />
          </BasisTheoryProvider>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </Layout>
  )
}

export default DonatePage
