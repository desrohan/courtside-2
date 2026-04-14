# @courtside/chat-sdk

[![npm](https://img.shields.io/npm/v/@courtside/chat-sdk)](https://www.npmjs.com/package/@courtside/chat-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for the Courtside Chat Platform. Wraps the Platform REST API and Session REST + Socket.io APIs into a fully-typed, developer-friendly client.

## Installation

```bash
npm install @courtside/chat-sdk
# or
yarn add @courtside/chat-sdk
# or
pnpm add @courtside/chat-sdk
```

## Quick Start

### Server-side (PlatformClient)

```ts
import { PlatformClient } from '@courtside/chat-sdk';

const platform = new PlatformClient({
  baseUrl: 'https://chat.example.com',
  apiToken: process.env.CHAT_API_TOKEN!,
  appId: process.env.CHAT_APP_ID!,
});

// Create a user and issue a session token
const user = await platform.createUser({ user_id: 'alice', nickname: 'Alice' });
const token = await platform.issueSessionToken('alice');
```

### Client-side (SessionClient)

```ts
import { SessionClient } from '@courtside/chat-sdk';

const client = new SessionClient({
  baseUrl: 'https://chat.example.com',
  sessionToken: token.token, // from your backend
  appId: 'your-app-id',
});

// Connect to real-time events
await client.connect();

client.onMessage((event) => {
  console.log(`${event.sender.nickname}: ${event.message.body}`);
});

await client.sendMessageRealtime('channel-url', 'Hello!');
```

---

## Architecture

The SDK exposes two clients with different authentication strategies:

| Client | Auth Headers | Use From |
|---|---|---|
| `PlatformClient` | `Api-Token` + `App-Id` | Server only (never expose API token to browsers) |
| `SessionClient` | `Session-Token` + `App-Id` | Browser or server (scoped to one end-user) |

---

## Configuration

### PlatformClientConfig

```ts
interface PlatformClientConfig {
  /** Base URL of the Courtside Chat Platform, e.g. https://chat.example.com */
  baseUrl: string;
  /** Master (or secondary) API token for server-to-server calls */
  apiToken: string;
  /** Application identifier */
  appId: string;
}
```

### SessionClientConfig

```ts
interface SessionClientConfig {
  /** Base URL of the Courtside Chat Platform, e.g. https://chat.example.com */
  baseUrl: string;
  /** Session token issued for the end-user via the Platform API */
  sessionToken: string;
  /** Application identifier */
  appId: string;
}
```

---

## PlatformClient API Reference

### Users

#### `createUser(params: CreateUserParams): Promise<AppUser>`

Create a new application user.

```ts
const user = await platform.createUser({
  user_id: 'user-123',
  nickname: 'Alice',
  profile_url: 'https://example.com/alice.jpg',
  metadata: { plan: 'pro' },
});
```

#### `listUsers(pagination?: PaginationParams): Promise<{ data: AppUser[]; pagination }>`

List all users (cursor-paginated).

```ts
const { data: users, pagination } = await platform.listUsers({ limit: 50 });
```

#### `getUser(userId: string): Promise<AppUser>`

Get a single user by their external user_id.

```ts
const user = await platform.getUser('user-123');
```

#### `updateUser(userId: string, params: UpdateUserParams): Promise<AppUser>`

Update a user's profile.

```ts
const updated = await platform.updateUser('user-123', { nickname: 'Alice B.' });
```

#### `deleteUser(userId: string): Promise<void>`

Deactivate (soft-delete) a user.

```ts
await platform.deleteUser('user-123');
```

#### `issueSessionToken(userId: string): Promise<SessionTokenResponse>`

Issue a session token so a frontend client can authenticate.

```ts
const token = await platform.issueSessionToken('user-123');
// token.token — pass this to the frontend
// token.expires_at — expiry timestamp
```

### Channels

#### `createChannel(params: CreateChannelParams): Promise<Channel>`

Create a new channel.

```ts
const channel = await platform.createChannel({
  type: 'group',
  name: 'Team Alpha',
  user_ids: ['user-123', 'user-456'],
  is_distinct: false,
});

// Direct message channel (reused if same pair exists with is_distinct: true)
const dm = await platform.createChannel({
  type: 'direct',
  user_ids: ['user-123', 'user-456'],
  is_distinct: true,
});
```

#### `listChannels(query?: ListChannelsParams): Promise<{ data: Channel[]; pagination }>`

List channels with optional filters.

```ts
const { data: channels } = await platform.listChannels({ type: 'group', user_id: 'user-123' });
```

#### `getChannel(channelUrl: string): Promise<Channel>`

Get a channel by its URL.

```ts
const channel = await platform.getChannel('channel-url-abc');
```

#### `updateChannel(channelUrl: string, params: UpdateChannelParams): Promise<Channel>`

Update channel metadata.

```ts
await platform.updateChannel('channel-url-abc', { name: 'Team Beta' });
```

#### `deleteChannel(channelUrl: string): Promise<void>`

Soft-delete a channel.

```ts
await platform.deleteChannel('channel-url-abc');
```

#### `freezeChannel(channelUrl: string, freeze: boolean): Promise<Channel>`

Freeze or unfreeze a channel (prevents new messages when frozen).

```ts
await platform.freezeChannel('channel-url-abc', true);  // freeze
await platform.freezeChannel('channel-url-abc', false); // unfreeze
```

### Members

#### `listMembers(channelUrl: string, pagination?: PaginationParams): Promise<{ data: ChannelMember[]; pagination }>`

List channel members (cursor-paginated).

```ts
const { data: members } = await platform.listMembers('channel-url-abc', { limit: 25 });
```

#### `inviteMembers(channelUrl: string, userIds: string[]): Promise<Channel>`

Invite one or more users to a channel.

```ts
await platform.inviteMembers('channel-url-abc', ['user-789']);
```

#### `removeMember(channelUrl: string, userIds: string[]): Promise<void>`

Remove one or more users from a channel.

```ts
await platform.removeMember('channel-url-abc', ['user-789']);
```

#### `banUser(channelUrl: string, userId: string): Promise<void>`

Ban a user from a channel.

```ts
await platform.banUser('channel-url-abc', 'user-789');
```

#### `unbanUser(channelUrl: string, userId: string): Promise<void>`

Unban a user from a channel.

```ts
await platform.unbanUser('channel-url-abc', 'user-789');
```

#### `muteUser(channelUrl: string, userId: string): Promise<void>`

Mute a user in a channel (they can read but not send messages).

```ts
await platform.muteUser('channel-url-abc', 'user-789');
```

#### `unmuteUser(channelUrl: string, userId: string): Promise<void>`

Unmute a previously muted user.

```ts
await platform.unmuteUser('channel-url-abc', 'user-789');
```

#### `addOperator(channelUrl: string, userId: string): Promise<void>`

Promote a user to channel operator.

```ts
await platform.addOperator('channel-url-abc', 'user-123');
```

#### `removeOperator(channelUrl: string, userId: string): Promise<void>`

Demote an operator back to regular member.

```ts
await platform.removeOperator('channel-url-abc', 'user-123');
```

### Messages

#### `sendMessage(channelUrl: string, params: SendMessageParams): Promise<Message>`

Send a message as any user (platform/admin send).

```ts
// Admin/system message
const msg = await platform.sendMessage('channel-url-abc', {
  type: 'admin',
  body: 'Welcome to the channel!',
});

// On behalf of a user
const userMsg = await platform.sendMessage('channel-url-abc', {
  type: 'user',
  body: 'Hello from server',
  sender_id: 'user-123',
  request_id: 'idempotency-key-xyz',
});
```

#### `listMessages(channelUrl: string, params?: ListMessagesParams): Promise<{ data: Message[]; pagination }>`

List messages in a channel (cursor-paginated).

```ts
const { data: messages, pagination } = await platform.listMessages('channel-url-abc', {
  limit: 50,
  before: 'cursor-value',
});
```

#### `editMessage(channelUrl: string, messageId: string, params: EditMessageParams): Promise<Message>`

Edit the body of a message.

```ts
await platform.editMessage('channel-url-abc', msg.id, { body: 'Updated text' });
```

#### `deleteMessage(channelUrl: string, messageId: string): Promise<void>`

Delete a message.

```ts
await platform.deleteMessage('channel-url-abc', msg.id);
```

#### `searchMessages(channelUrl: string, params: SearchMessagesParams): Promise<{ data: Message[]; pagination }>`

Full-text search messages in a channel.

```ts
const { data: results } = await platform.searchMessages('channel-url-abc', {
  query: 'meeting notes',
  mode: 'full_text',
  limit: 20,
});
```

### Reactions

#### `addReaction(channelUrl: string, messageId: string, userId: string, reactionKey: string): Promise<ReactionGroup[]>`

Add a reaction to a message.

```ts
const reactions = await platform.addReaction('channel-url-abc', msg.id, 'user-123', 'thumbsup');
```

#### `removeReaction(channelUrl: string, messageId: string, userId: string, reactionKey: string): Promise<ReactionGroup[]>`

Remove a reaction from a message.

```ts
await platform.removeReaction('channel-url-abc', msg.id, 'user-123', 'thumbsup');
```

### Threads

#### `getThreadReplies(channelUrl: string, messageId: string, pagination?: PaginationParams): Promise<{ data: Message[]; pagination }>`

Get thread replies for a parent message.

```ts
const { data: replies } = await platform.getThreadReplies('channel-url-abc', parentMsg.id);
```

#### `replyToThread(channelUrl: string, messageId: string, params: { body: string; sender_id: string; type?: string }): Promise<Message>`

Post a reply inside a message thread.

```ts
const reply = await platform.replyToThread('channel-url-abc', parentMsg.id, {
  body: 'This is a thread reply',
  sender_id: 'user-123',
});
```

### Pins

#### `pinMessage(channelUrl: string, messageId: string, userId: string): Promise<void>`

Pin a message in a channel.

```ts
await platform.pinMessage('channel-url-abc', msg.id, 'user-123');
```

#### `unpinMessage(channelUrl: string, messageId: string): Promise<void>`

Unpin a pinned message.

```ts
await platform.unpinMessage('channel-url-abc', msg.id);
```

#### `listPinnedMessages(channelUrl: string): Promise<Message[]>`

List all pinned messages in a channel.

```ts
const pinned = await platform.listPinnedMessages('channel-url-abc');
```

### Polls

#### `createPoll(channelUrl: string, params: CreatePollParams): Promise<Poll>`

Create a poll in a channel.

```ts
const poll = await platform.createPoll('channel-url-abc', {
  title: 'Lunch preference?',
  options: ['Pizza', 'Sushi', 'Tacos'],
  creator_user_id: 'user-123',
  allow_multiple: false,
});
```

#### `getPoll(channelUrl: string, pollId: string): Promise<Poll>`

Get a poll by its ID.

```ts
const poll = await platform.getPoll('channel-url-abc', poll.id);
```

#### `vote(channelUrl: string, pollId: string, optionIds: string[], userId: string): Promise<Poll>`

Cast votes on a poll.

```ts
await platform.vote('channel-url-abc', poll.id, [poll.options[0].id], 'user-456');
```

#### `removeVote(channelUrl: string, pollId: string, userId: string): Promise<Poll>`

Remove a user's votes from a poll.

```ts
await platform.removeVote('channel-url-abc', poll.id, 'user-456');
```

### Scheduled Messages

#### `scheduleMessage(channelUrl: string, params: ScheduleMessageParams): Promise<ScheduledMessage>`

Schedule a message for future delivery.

```ts
const scheduled = await platform.scheduleMessage('channel-url-abc', {
  body: 'Good morning, team!',
  sender_id: 'user-123',
  scheduled_at: '2026-05-01T09:00:00Z',
});
```

#### `listScheduledMessages(channelUrl: string): Promise<ScheduledMessage[]>`

List scheduled messages for a channel.

```ts
const list = await platform.listScheduledMessages('channel-url-abc');
```

#### `updateScheduledMessage(channelUrl: string, id: string, params: UpdateScheduledMessageParams): Promise<ScheduledMessage>`

Update a pending scheduled message.

```ts
await platform.updateScheduledMessage('channel-url-abc', scheduled.id, {
  scheduled_at: '2026-05-02T09:00:00Z',
});
```

#### `cancelScheduledMessage(channelUrl: string, id: string): Promise<void>`

Cancel a pending scheduled message.

```ts
await platform.cancelScheduledMessage('channel-url-abc', scheduled.id);
```

### Push Notifications

#### `registerDeviceToken(userId: string, params: RegisterDeviceTokenParams): Promise<void>`

Register a device token for push notifications.

```ts
await platform.registerDeviceToken('user-123', {
  token: 'fcm-device-token',
  platform: 'fcm',
});
```

#### `removeDeviceToken(userId: string, token: string): Promise<void>`

Remove a device token (e.g. on logout).

```ts
await platform.removeDeviceToken('user-123', 'fcm-device-token');
```

---

## SessionClient API Reference

### Current User

#### `getMe(): Promise<AppUser>`

Get the authenticated user's profile.

```ts
const me = await client.getMe();
```

#### `getMyChannels(): Promise<{ data: ChannelWithUnread[]; pagination }>`

Get all channels the authenticated user belongs to (with unread counts).

```ts
const { data: channels } = await client.getMyChannels();
```

#### `getUnreadCount(): Promise<UnreadCountResponse>`

Get the total unread message count across all channels.

```ts
const { total_unread_count, channels } = await client.getUnreadCount();
```

### Messages

#### `sendMessage(channelUrl: string, params: SessionSendMessageParams): Promise<Message>`

Send a message to a channel via REST.

```ts
const msg = await client.sendMessage('channel-url-abc', {
  body: 'Hello!',
  type: 'user',
  request_id: 'client-generated-uuid',
});
```

#### `listMessages(channelUrl: string, pagination?: ListMessagesParams): Promise<{ data: Message[]; pagination }>`

List messages in a channel (cursor-paginated).

```ts
const { data: messages } = await client.listMessages('channel-url-abc', { limit: 30 });
```

#### `editMessage(channelUrl: string, messageId: string, body: string): Promise<Message>`

Edit one of the authenticated user's own messages.

```ts
await client.editMessage('channel-url-abc', msg.id, 'Updated text');
```

#### `deleteMessage(channelUrl: string, messageId: string): Promise<void>`

Delete one of the authenticated user's own messages.

```ts
await client.deleteMessage('channel-url-abc', msg.id);
```

#### `markAsRead(channelUrl: string): Promise<void>`

Mark a channel as read (clears unread count).

```ts
await client.markAsRead('channel-url-abc');
```

### Reactions

#### `addReaction(channelUrl: string, messageId: string, reactionKey: string): Promise<ReactionGroup[]>`

Add a reaction to a message.

```ts
await client.addReaction('channel-url-abc', msg.id, 'heart');
```

#### `removeReaction(channelUrl: string, messageId: string, reactionKey: string): Promise<ReactionGroup[]>`

Remove a reaction from a message.

```ts
await client.removeReaction('channel-url-abc', msg.id, 'heart');
```

### Threads

#### `replyToThread(channelUrl: string, messageId: string, body: string): Promise<Message>`

Reply to a message in its thread.

```ts
const reply = await client.replyToThread('channel-url-abc', msg.id, 'Reply text');
```

#### `getThreadReplies(channelUrl: string, messageId: string, pagination?: PaginationParams): Promise<{ data: Message[]; pagination }>`

Get thread replies for a parent message.

```ts
const { data: replies } = await client.getThreadReplies('channel-url-abc', msg.id);
```

### Pins

#### `pinMessage(channelUrl: string, messageId: string): Promise<void>`

Pin a message in a channel.

```ts
await client.pinMessage('channel-url-abc', msg.id);
```

#### `unpinMessage(channelUrl: string, messageId: string): Promise<void>`

Unpin a message.

```ts
await client.unpinMessage('channel-url-abc', msg.id);
```

#### `listPinnedMessages(channelUrl: string): Promise<Message[]>`

List all pinned messages in a channel.

```ts
const pinned = await client.listPinnedMessages('channel-url-abc');
```

### Polls

#### `createPoll(channelUrl: string, params: SessionCreatePollParams): Promise<Poll>`

Create a poll in a channel.

```ts
const poll = await client.createPoll('channel-url-abc', {
  title: 'Standup time?',
  options: ['9am', '10am', '11am'],
});
```

#### `votePoll(channelUrl: string, pollId: string, optionIds: string[]): Promise<Poll>`

Vote on a poll.

```ts
await client.votePoll('channel-url-abc', poll.id, [poll.options[0].id]);
```

### WebSocket Connection

#### `connect(options?: ConnectOptions): Promise<WsConnectionReady>`

Connect to the real-time WebSocket. Resolves when the server confirms the connection is ready.

```ts
const ready = await client.connect();
console.log('Connected, joined channels:', ready.channels);

// Resume after disconnect
const resumed = await client.connect({
  resumeToken: 'token-from-previous-session',
  lastEventId: 'last-received-event-ulid',
});
```

#### `disconnect(): void`

Disconnect the WebSocket. Safe to call even if not connected.

```ts
client.disconnect();
```

#### `isConnected: boolean`

True if the socket is currently connected.

```ts
if (client.isConnected) { /* ... */ }
```

### WebSocket Emit Methods

#### `sendMessageRealtime(channelUrl: string, body: string, options?: SendMessageRealtimeOptions): Promise<WsAckResponse>`

Send a message via WebSocket with server acknowledgement. Faster than REST as it avoids an HTTP round-trip.

```ts
const ack = await client.sendMessageRealtime('channel-url-abc', 'Hi there!', {
  requestId: 'idempotency-key',
  parentMessageId: 'parent-msg-id', // for thread replies
});
if (!ack.ok) console.error('Send failed:', ack.error);
```

#### `editMessageRealtime(channelUrl: string, messageId: string, body: string): void`

Edit a message via WebSocket.

```ts
client.editMessageRealtime('channel-url-abc', msg.id, 'Updated text');
```

#### `deleteMessageRealtime(channelUrl: string, messageId: string): void`

Delete a message via WebSocket.

```ts
client.deleteMessageRealtime('channel-url-abc', msg.id);
```

#### `startTyping(channelUrl: string): void`

Indicate the user has started typing.

```ts
client.startTyping('channel-url-abc');
```

#### `stopTyping(channelUrl: string): void`

Indicate the user has stopped typing.

```ts
client.stopTyping('channel-url-abc');
```

#### `markReadRealtime(channelUrl: string, messageId: string): void`

Acknowledge reading up to a specific message.

```ts
client.markReadRealtime('channel-url-abc', lastMessage.id);
```

#### `addReactionRealtime(channelUrl: string, messageId: string, reactionKey: string): void`

Add a reaction via WebSocket.

```ts
client.addReactionRealtime('channel-url-abc', msg.id, 'thumbsup');
```

#### `removeReactionRealtime(channelUrl: string, messageId: string, reactionKey: string): void`

Remove a reaction via WebSocket.

```ts
client.removeReactionRealtime('channel-url-abc', msg.id, 'thumbsup');
```

### WebSocket Subscribe Methods

All subscribe methods return `this` for chaining.

#### `onMessage(callback: (data: WsMessageNew) => void): this`

Subscribe to new messages across all joined channels.

#### `onMessageUpdated(callback: (data: WsMessageUpdated) => void): this`

Subscribe to message edits.

#### `onMessageDeleted(callback: (data: WsMessageDeleted) => void): this`

Subscribe to message deletions.

#### `onTyping(callback: (data: WsTypingUpdate) => void): this`

Subscribe to typing indicator updates.

#### `onUserRead(callback: (data: WsUserRead) => void): this`

Subscribe to read receipts from other users.

#### `onReactionUpdated(callback: (data: WsReactionUpdated) => void): this`

Subscribe to reaction changes on any message.

#### `onChannelUpdated(callback: (data: WsChannelUpdated) => void): this`

Subscribe to channel metadata updates.

#### `onMemberJoined(callback: (data: WsChannelMemberJoined) => void): this`

Subscribe to member join events.

#### `onMemberLeft(callback: (data: WsChannelMemberLeft) => void): this`

Subscribe to member leave events.

#### `onSyncRequired(callback: (data: WsSyncRequired) => void): this`

Subscribe to the `sync:required` event, fired when the server cannot replay all missed events and the client must perform a full REST sync.

#### `off(event: string): this`

Remove all listeners for a specific event.

#### `removeAllListeners(): this`

Remove all event listeners from the socket.

```ts
client
  .onMessage((event) => console.log('New:', event.message.body))
  .onTyping((event) => console.log(event.userId, event.isTyping ? 'typing...' : 'stopped'))
  .onReactionUpdated((event) => console.log('Reactions:', event.reactions))
  .onMemberJoined((event) => console.log(event.user.user_id, 'joined'))
  .onMemberLeft((event) => console.log(event.userId, 'left'))
  .onSyncRequired(() => {
    // Full REST sync needed
    client.getMyChannels().then(({ data }) => console.log('Re-synced', data.length, 'channels'));
  });
```

---

## Real-Time Events

| Socket Event | Callback Method | Payload Type | Description |
|---|---|---|---|
| `connection:ready` | (returned by `connect()`) | `WsConnectionReady` | Server confirms connection, lists joined channels |
| `message:new` | `onMessage` | `WsMessageNew` | New message in any joined channel |
| `message:updated` | `onMessageUpdated` | `WsMessageUpdated` | A message was edited |
| `message:deleted` | `onMessageDeleted` | `WsMessageDeleted` | A message was deleted |
| `typing:update` | `onTyping` | `WsTypingUpdate` | User started or stopped typing |
| `user:read` | `onUserRead` | `WsUserRead` | User read up to a specific message |
| `reaction:updated` | `onReactionUpdated` | `WsReactionUpdated` | Reactions changed on a message |
| `channel:updated` | `onChannelUpdated` | `WsChannelUpdated` | Channel metadata changed |
| `channel:member_joined` | `onMemberJoined` | `WsChannelMemberJoined` | A user joined a channel |
| `channel:member_left` | `onMemberLeft` | `WsChannelMemberLeft` | A user left a channel |
| `sync:required` | `onSyncRequired` | `WsSyncRequired` | Client must do a full REST sync |

### Emit Events

| Socket Event | Method | Description |
|---|---|---|
| `message:send` | `sendMessageRealtime` | Send a message (with ack) |
| `message:edit` | `editMessageRealtime` | Edit a message |
| `message:delete` | `deleteMessageRealtime` | Delete a message |
| `typing:start` | `startTyping` | Start typing indicator |
| `typing:stop` | `stopTyping` | Stop typing indicator |
| `channel:read` | `markReadRealtime` | Mark channel as read up to a message |
| `reaction:add` | `addReactionRealtime` | Add a reaction |
| `reaction:remove` | `removeReactionRealtime` | Remove a reaction |

---

## Error Handling

All methods throw `ChatApiError` when the server returns `ok: false` or when a network failure occurs.

```ts
import { ChatApiError, ChatSocketNotConnectedError } from '@courtside/chat-sdk';

try {
  await platform.getUser('nonexistent');
} catch (err) {
  if (err instanceof ChatApiError) {
    console.error(err.code, err.message);
    // e.g. "NOT_FOUND", "User not found"
    // err.statusCode may be set for parse errors
  }
}
```

### Error Classes

#### `ChatApiError`

Thrown when the API returns `ok: false` or a network/parse error occurs.

| Property | Type | Description |
|---|---|---|
| `code` | `string` | Error code (e.g. `NOT_FOUND`, `NETWORK_ERROR`, `PARSE_ERROR`, `UNKNOWN_ERROR`) |
| `message` | `string` | Human-readable error message |
| `statusCode` | `number \| undefined` | HTTP status code (set for parse errors) |

#### `ChatSocketNotConnectedError`

Thrown when a WebSocket operation is attempted before calling `connect()`.

```ts
try {
  client.startTyping('channel-url-abc'); // before connect()
} catch (err) {
  if (err instanceof ChatSocketNotConnectedError) {
    await client.connect();
  }
}
```

---

## TypeScript Types

All types are exported from the package root:

```ts
import type {
  // Response envelope
  ApiResponse,

  // Entities
  AppUser,
  Channel,
  ChannelType,          // 'direct' | 'group' | 'super_group' | 'broadcast' | 'open'
  ChannelWithUnread,
  Message,
  MessageType,          // 'user' | 'file' | 'admin'
  MessageSender,
  MessageFile,
  ChannelMember,
  MemberRole,           // 'owner' | 'operator' | 'member'
  MemberState,          // 'joined' | 'invited'
  ReactionGroup,
  ReactionUser,
  Poll,
  PollOption,
  ScheduledMessage,
  ScheduledMessageStatus,
  UnreadCountResponse,
  SessionTokenResponse,
  Owner,
  Application,
  ApplicationWithToken,

  // WebSocket event payloads
  WsConnectionReady,
  WsMessageNew,
  WsMessageUpdated,
  WsMessageDeleted,
  WsTypingUpdate,
  WsChannelUpdated,
  WsChannelMemberJoined,
  WsChannelMemberLeft,
  WsUserRead,
  WsReactionUpdated,
  WsSyncRequired,
  WsAckResponse,

  // Input params
  PaginationParams,
  CreateUserParams,
  UpdateUserParams,
  CreateChannelParams,
  UpdateChannelParams,
  ListChannelsParams,
  SendMessageParams,
  EditMessageParams,
  ListMessagesParams,
  SearchMessagesParams,
  AddReactionParams,
  RemoveReactionParams,
  CreatePollParams,
  VoteParams,
  ScheduleMessageParams,
  UpdateScheduledMessageParams,
  RegisterDeviceTokenParams,
  SendMessageRealtimeOptions,
  SessionSendMessageParams,
  SessionCreatePollParams,
  ConnectOptions,
} from '@courtside/chat-sdk';
```

---

## Examples

See the [`examples/`](./examples) directory for runnable scripts:

- **[quickstart.ts](./examples/quickstart.ts)** -- Create a user, create a channel, send a message
- **[realtime-chat.ts](./examples/realtime-chat.ts)** -- Two users connecting via SessionClient with real-time messaging
- **[moderation.ts](./examples/moderation.ts)** -- Reactions, pins, polls, and threads via PlatformClient

Run any example with:

```bash
export API_URL=http://localhost:3100
export API_TOKEN=your-api-token
export APP_ID=your-app-id

npx tsx examples/quickstart.ts
```

### Create users and a channel

```ts
const alice = await platform.createUser({ user_id: 'alice', nickname: 'Alice' });
const bob = await platform.createUser({ user_id: 'bob', nickname: 'Bob' });

const channel = await platform.createChannel({
  type: 'group',
  name: 'General',
  user_ids: ['alice', 'bob'],
});
```

### Send messages in a channel

```ts
// Via PlatformClient (server-side, on behalf of a user)
await platform.sendMessage(channel.channel_url, {
  type: 'user',
  body: 'Hello from Alice!',
  sender_id: 'alice',
});

// Via SessionClient (client-side)
await client.sendMessage(channel.channel_url, { body: 'Hello from Bob!' });

// Via WebSocket (lowest latency)
const ack = await client.sendMessageRealtime(channel.channel_url, 'Real-time hello!');
```

### Real-time chat between two users

```ts
// On Alice's client
const aliceToken = await platform.issueSessionToken('alice');
const aliceClient = new SessionClient({
  baseUrl: 'https://chat.example.com',
  sessionToken: aliceToken.token,
  appId: 'your-app-id',
});
await aliceClient.connect();
aliceClient.onMessage((event) => {
  console.log(`Alice sees: ${event.sender.nickname}: ${event.message.body}`);
});

// On Bob's client
const bobToken = await platform.issueSessionToken('bob');
const bobClient = new SessionClient({
  baseUrl: 'https://chat.example.com',
  sessionToken: bobToken.token,
  appId: 'your-app-id',
});
await bobClient.connect();
bobClient.onMessage((event) => {
  console.log(`Bob sees: ${event.sender.nickname}: ${event.message.body}`);
});

// Send messages
await aliceClient.sendMessageRealtime(channel.channel_url, 'Hey Bob!');
await bobClient.sendMessageRealtime(channel.channel_url, 'Hey Alice!');
```

### Moderate content with reactions and pins

```ts
// Add reactions
await platform.addReaction(channel.channel_url, msg.id, 'alice', 'thumbsup');

// Pin important messages
await platform.pinMessage(channel.channel_url, msg.id, 'alice');
const pinned = await platform.listPinnedMessages(channel.channel_url);

// Unpin when no longer needed
await platform.unpinMessage(channel.channel_url, msg.id);
```

### Polls and threads

```ts
// Create a poll
const poll = await platform.createPoll(channel.channel_url, {
  title: 'Where should we eat?',
  options: ['Pizza', 'Sushi', 'Tacos'],
  creator_user_id: 'alice',
  allow_multiple: false,
});

// Vote
await platform.vote(channel.channel_url, poll.id, [poll.options[1].id], 'bob');

// Thread replies
const reply = await platform.replyToThread(channel.channel_url, msg.id, {
  body: 'Great idea!',
  sender_id: 'bob',
});
const { data: threadReplies } = await platform.getThreadReplies(channel.channel_url, msg.id);
```

---

## Requirements

- Node.js 18+ (uses native `fetch`) or any modern browser
- `socket.io-client` ^4.7 (bundled dependency)

## License

[MIT](./LICENSE)
