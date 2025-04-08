/**
 * Prime Rate Controller
 * 
 * This controller handles API requests for prime rate data
 */

import { Request, Response } from 'express';
import { getPrimeRate } from './primeRateService';

/**
 * Get the current prime rate
 * @param req Express request
 * @param res Express response
 */
export async function getPrimeRateHandler(req: Request, res: Response) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const primeRateData = await getPrimeRate(forceRefresh);
    
    res.status(200).json({
      primeRate: primeRateData.primeRate,
      effectiveDate: primeRateData.effectiveDate,
      lastUpdated: primeRateData.lastUpdated,
    });
  } catch (error) {
    console.error('Error in prime rate handler:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve prime rate',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}