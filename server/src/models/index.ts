export { default as User } from './User';
export type { IUser, IAvailabilitySlot, ILocation, IUserStats, IUserGamification, IUserMapPreferences, IUserQuietHours } from './User';

export { default as Skill } from './Skill';
export type { ISkill, ISkillMedia, ISkillLocation } from './Skill';

export { default as Category } from './Category';
export type { ICategory, ISkillItem } from './Category';

export { default as Connection } from './Connection';
export type { IConnection, ConnectionStatus } from './Connection';

// Use Message.model.ts as the canonical Message model
export { default as Message } from './Message.model';
export type {
  IMessageDocument,
  IInboxReaction,
  MessageType,
  ReactionEmoji,
  SystemMessageEvent,
  ISkillCardData,
  IReplyToPreview,
} from './Message.model';

export { default as Conversation } from './Conversation.model';
export type { ConversationSummary } from './Conversation.model';

export { default as UserInboxPreference } from './UserInboxPreference.model';
export type { IUserInboxPreferenceDocument } from './UserInboxPreference.model';

export { default as ConversationSettings } from './ConversationSettings.model';
export type {
  IConversationSettings,
  ConversationType,
  ConversationNotificationOverride,
  ConversationTheme,
} from './ConversationSettings.model';

export { default as Review } from './Review';
export type { IReview, ReviewTag } from './Review';

export { default as Report } from './Report';
export type { IReport, ReportTargetType, ReportReason, ReportStatus, ReportAction } from './Report';

export { default as Notification } from './Notification';
export type { INotification, NotificationType } from './Notification';

export { default as TokenBlacklist } from './TokenBlacklist';
export type { ITokenBlacklist } from './TokenBlacklist';

export { default as Block } from './Block';
export type { IBlock } from './Block';

export { default as SkillSwap } from './SkillSwap';
export type { ISkillSwap, SwapStatus } from './SkillSwap';

export { default as GroupSession } from './GroupSession';
export type { IGroupSession, GroupSessionStatus, GroupSessionType } from './GroupSession';

export { default as SavedSearch } from './SavedSearch';
export type { ISavedSearch, ISavedSearchFilter } from './SavedSearch';

export { default as CommunityPost } from './CommunityPost';
export type { ICommunityPost, IUserVote } from './CommunityPost';

export { default as Endorsement } from './Endorsement';
export type { IEndorsement } from './Endorsement';

export { default as AuditLog } from './AuditLog';
export type { IAuditLog } from './AuditLog';

export { default as PasswordResetToken } from './PasswordResetToken';
export type { IPasswordResetToken } from './PasswordResetToken';

export { default as EmailVerificationToken } from './EmailVerificationToken';
export type { IEmailVerificationToken } from './EmailVerificationToken';

export { default as RefreshToken } from './RefreshToken';
export type { IRefreshToken } from './RefreshToken';

export { default as OAuthProvider } from './OAuthProvider';
export type { IOAuthProvider, OAuthProviderName } from './OAuthProvider';

export { default as TwoFactorSecret } from './TwoFactorSecret';
export type { ITwoFactorSecret } from './TwoFactorSecret';

export { default as SkillSuggestion } from './SkillSuggestion';
export type { ISkillSuggestion, SkillSuggestionStatus } from './SkillSuggestion';

export { default as SkillBundle } from './SkillBundle';
export type { ISkillBundle } from './SkillBundle';

export { default as BlockOutDate } from './BlockOutDate';
export type { IBlockOutDate } from './BlockOutDate';

export { default as LearnerRequest } from './LearnerRequest';
export type { ILearnerRequest, LearnerRequestStatus } from './LearnerRequest';

export { default as SessionNote } from './SessionNote';
export type { ISessionNote } from './SessionNote';

export { default as Tip } from './Tip';
export type { ITip, TipStatus } from './Tip';

export { default as Course } from './Course';
export type { ICourse, ICourseSession, CourseStatus } from './Course';

export { default as CourseEnrollment } from './CourseEnrollment';
export type { ICourseEnrollment, ISessionProgress, EnrollmentStatus } from './CourseEnrollment';

export { default as Challenge } from './Challenge';
export type { IChallenge, IChallengeParticipant, ChallengeStatus } from './Challenge';

export { default as Mentorship } from './Mentorship';
export type { IMentorship, IGoal, ICheckIn, MentorshipStatus } from './Mentorship';

export { default as Showcase } from './Showcase';
export type { IShowcase, IShowcaseMedia, IShowcaseLike } from './Showcase';

export { default as Webhook } from './Webhook';
export type { IWebhook, IWebhookLog, WebhookEvent, WebhookStatus } from './Webhook';

export { default as ApiKey } from './ApiKey';
export type { IApiKey, ApiKeyStatus } from './ApiKey';

export { default as CalendarIntegration } from './CalendarIntegration';
export type { ICalendarIntegration, ICalendarEvent, CalendarProvider, CalendarSyncStatus } from './CalendarIntegration';

export { default as BotInstallation } from './BotInstallation';
export type { IBotInstallation, BotPlatform, BotStatus } from './BotInstallation';

export { default as Friendship } from './Friendship';
export type { IFriendship, FriendshipStatus, FriendTier, FriendshipMetVia } from './Friendship';

export { default as ActivityEvent } from './ActivityEvent';
export type {
  IActivityEvent,
  IActivityReaction,
  IActivityPreview,
  ActivityEventType,
  ActivityVisibility,
  ActivitySubjectType,
} from './ActivityEvent';

export { default as Streak } from './Streak';
export type { IStreak, StreakType } from './Streak';

export { default as DirectMessage } from './DirectMessage';
export type { IDirectMessage } from './DirectMessage';

export { default as SkillJournal } from './SkillJournal';
export type { ISkillJournal } from './SkillJournal';

export { default as RequestTemplate } from './RequestTemplate';
export type { IRequestTemplate } from './RequestTemplate';

export { default as SkillRadar } from './SkillRadar';
export type {
  ISkillRadar,
  ISkillRadarSignal,
  ISkillRadarIntent,
  IManualRadar,
  IManualRadarFilter,
  RadarSignalType,
  RadarConfidence,
  RadarIntentStatus,
  RadarFormat,
} from './SkillRadar';

export { default as SwapReadyMatch } from './SwapReadyMatch';
export type { ISwapReadyMatch, SwapReadyMatchStatus } from './SwapReadyMatch';

export { default as SkillDemandSnapshot } from './SkillDemandSnapshot';
export type { ISkillDemandSnapshot, IDemandSkill, IDemandRegion } from './SkillDemandSnapshot';
