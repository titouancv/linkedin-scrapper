import FeedClient from "./feed-client";

export default function FeedPage({ params }: { params: { topic: string } }) {
  return <FeedClient topic={params.topic} />;
}
