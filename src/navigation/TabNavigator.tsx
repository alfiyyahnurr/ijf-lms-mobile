import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../types/navigation';
import CustomBottomTabBar from '../components/navigation/CustomBottomTabBar';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import WeeklyPlanScreen from '../screens/weekly/WeeklyPlanScreen';
import CoursesScreen from '../screens/courses/CoursesScreen';
import HabitsScreen from '../screens/habits/HabitsScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import AssignmentsScreen from '../screens/assignments/AssignmentsScreen';
import QuizzesScreen from '../screens/quizzes/QuizzesScreen';
import ExamsScreen from '../screens/exams/ExamsScreen';
import ReportCardScreen from '../screens/report/ReportCardScreen';
import LiteracyScreen from '../screens/literacy/LiteracyScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="DashboardTab"
    >
      {/* 5 Core Tabs */}
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="WeeklyTab" component={WeeklyPlanScreen} />
      <Tab.Screen name="CoursesTab" component={CoursesScreen} />
      <Tab.Screen name="HabitsTab" component={HabitsScreen} />
      <Tab.Screen name="BoardTab" component={LeaderboardScreen} />

      {/* Secondary Screens that MUST preserve the Bottom Nav Bar */}
      <Tab.Screen name="AssignmentsTab" component={AssignmentsScreen} />
      <Tab.Screen name="QuizzesTab" component={QuizzesScreen} />
      <Tab.Screen name="ExamsTab" component={ExamsScreen} />
      <Tab.Screen name="ReportCardTab" component={ReportCardScreen} />
      <Tab.Screen name="LiteracyTab" component={LiteracyScreen} />
      <Tab.Screen name="AnnouncementsTab" component={AnnouncementsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
