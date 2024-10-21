// // src/pages/api/ai-insights.ts

// import type { NextApiRequest, NextApiResponse } from 'next'
// import { performMarketingCampaignAnalysis } from '../../utils/marketingAIAnalysis'
// import { performFinancialAnalysis } from '../../utils/financialAIAnalysis'
// import { CampaignData } from '../../types/marketing'
// import { FinancialDataPoint } from '../../../types/finance'

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method === 'GET') {
//     const { dashboard, input } = req.query

//     if (!dashboard || !input) {
//       return res.status(400).json({ error: 'Missing dashboard or input parameter' })
//     }

//     try {
//       let result

//       switch (dashboard) {
//         case 'marketing':
//           // You'll need to fetch or pass the campaigns data somehow
//           const campaigns: CampaignData[] = [] // Replace with actual data
//           result = await performMarketingCampaignAnalysis(input as string, campaigns)
//           break
//         case 'financial':
//           // You'll need to fetch or pass the financial data somehow
//           const financialData: FinancialDataPoint[] = [] // Replace with actual data
//           result = await performFinancialAnalysis(input as string, financialData)
//           break
//         default:
//           return res.status(400).json({ error: 'Invalid dashboard type' })
//       }

//       res.status(200).json(result)
//     } catch (error) {
//       console.error('Error in AI analysis:', error)
//       res.status(500).json({ error: 'An error occurred during analysis' })
//     }
//   } else {
//     res.setHeader('Allow', ['GET'])
//     res.status(405).end(`Method ${req.method} Not Allowed`)
//   }
// }