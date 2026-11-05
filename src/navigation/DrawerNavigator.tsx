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

  // Exactly matches Web sidebar width: w-72 (288px) on mobile, 320px on tablet
  const drawerWidth = width >= 768 ? 320 : 288;

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
        overlayColor: 'rgba(0, 0, 0, 0.50)', // Matches Web bg-black/50
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
