import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerParamList } from '../types/navigation';
import { COLORS } from '../constants/theme';
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';
import TabNavigator from './TabNavigator';

const Drawer = createDrawerNavigator<DrawerParamList>();

export const DrawerNavigator: React.FC = () => {
  const { width } = useWindowDimensions();

  // Match reference screenshot proportion: 74% on mobile, max 320 on tablets
  const drawerWidth = width >= 768 ? 320 : Math.round(width * 0.74);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front', // Always front overlay modal across all devices
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: '#5001B2',
        },
        overlayColor: 'rgba(15, 23, 42, 0.55)',
        swipeEdgeWidth: 100,
        swipeEnabled: true,
      }}
      initialRouteName="MainTabs"
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
