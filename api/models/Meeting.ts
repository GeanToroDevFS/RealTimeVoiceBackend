/**
 * Represents a meeting entity.
 *
 * @interface Meeting
 * @property {string} id - Unique identifier for the meeting.
 * @property {string} creatorId - Identifier of the user who created the meeting.
 * @property {'active' | 'ended'} status - Current status of the meeting.
 *   - `active`: The meeting is ongoing.
 *   - `ended`: The meeting has finished.
 * @property {Date} createdAt - Timestamp indicating when the meeting was created.
 *
 * @example
 * const meeting: Meeting = {
 *   id: '12345',
 *   creatorId: 'user_001',
 *   status: 'active',
 *   createdAt: new Date()
 * };
 */
export interface Meeting {
  id: string;
  creatorId: string;
  status: 'active' | 'ended';
  createdAt: Date;
}

/**
 * Represents the data required to create a new meeting.
 *
 * @interface MeetingCreate
 * @property {string} creatorId - Identifier of the user creating the meeting.
 *
 * @example
 * const newMeeting: MeetingCreate = {
 *   creatorId: 'user_001'
 * };
 */
export interface MeetingCreate {
  creatorId: string;
}