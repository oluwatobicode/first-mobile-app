import { EmptyState, TabScreen } from '@/components/tab-screen';

export default function MessagesScreen() {
  return (
    <TabScreen title="Messages">
      <EmptyState
        emoji="💬"
        heading="You don’t have any messages"
        body="When you contact a host or send a reservation request, you’ll see your messages here."
      />
    </TabScreen>
  );
}
