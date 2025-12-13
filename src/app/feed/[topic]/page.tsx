import FeedClient from "./feed-client";

export default async function FeedPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  return <FeedClient topic={topic} />;
}
