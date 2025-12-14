// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api");

export type TrendResult = {
  keyword: string;
  score: number;
};

type TimelineDataPoint = {
  time: string;
  formattedTime: string;
  formattedAxisTime: string;
  value: number[];
  hasData: boolean[];
  formattedValue: string[];
};

type InterestOverTimeResult = {
  default: {
    timelineData: TimelineDataPoint[];
    averages: number[];
  };
};

/**
 * Compare multiple keywords and get relative popularity scores
 * This is more accurate than individual queries as it compares keywords directly
 */
export async function compareKeywordsPopularity(
  keywords: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  if (keywords.length === 0) {
    return results;
  }

  const batchSize = 5;
  const batches: string[][] = [];

  for (let i = 0; i < keywords.length; i += batchSize) {
    batches.push(keywords.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      const response = await googleTrends.interestOverTime({
        keyword: batch,
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      const data: InterestOverTimeResult = JSON.parse(response);

      batch.forEach((keyword, index) => {
        const timelineData: TimelineDataPoint[] =
          data.default.timelineData.filter((point) => point.hasData[index]);

        if (timelineData.length === 0) {
          results.set(keyword, 0);
          return;
        }

        const scores = timelineData.map((point) => point.value[index] || 0);
        const averageScore =
          scores.reduce((sum, val) => sum + val, 0) / scores.length;

        results.set(keyword, Math.round(averageScore));
      });

      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error comparing trends for batch:`, batch, error);
      batch.forEach((keyword) => results.set(keyword, 0));
    }
  }

  return results;
}
