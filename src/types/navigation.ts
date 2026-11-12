export type RootStackParamList = {
  Login: undefined;
  MainDrawer: undefined;
};

export type DrawerParamList = {
  MainTabs: { screen?: keyof BottomTabParamList } | undefined;
};

export type BottomTabParamList = {
  DashboardTab: undefined;
  WeeklyTab: undefined;
  CoursesTab: undefined;
  HabitsTab: undefined;
  BoardTab: { initialTab?: 'house' | 'jenjang' | 'class'; resetKey?: number } | undefined;
  AssignmentsTab: { assignmentId?: number; isDetail?: boolean } | undefined;
  QuizzesTab: undefined;
  ExamsTab: undefined;
  ReportCardTab: undefined;
  LiteracyTab: undefined;
  AnnouncementsTab: undefined;
  ProfileTab: undefined;
};
