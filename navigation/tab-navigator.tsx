import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { View } from 'react-native';
import { RootStackParamList } from '.';
import ReactionTestView from '../screens/ReactionTestView';
import RankingView from '../screens/RankingView';
import SettingView from '../screens/SettingView';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MyRecordView from "../screens/MyRecordView";

const Tab = createBottomTabNavigator();

type Props = StackScreenProps<RootStackParamList, 'TabNavigator'>;

export default function TabLayout({ navigation }: Props) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#ea411b',
        tabBarStyle: {
          height: 100, // 전체 탭바의 높이를 증가
          borderRadius: 30,
          backgroundColor: '#323232',
          borderTopColor: 'transparent',
          position: 'absolute',
          paddingBottom: 30, // 하단 여백 추가
        },
        tabBarItemStyle: {
          paddingTop: 5, // 각 탭 아이템의 패딩 조정
          paddingBottom: 8,
        },
      }}>
      <Tab.Screen
        name="ReactionTestView"
        component={ReactionTestView}
        options={{
          title: '테스트하기',
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: -5,
          },
          tabBarIcon: ({ color }) => (
              <FontAwesome6 size={28} name="fire-flame-simple" color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Two"
        component={MyRecordView}
        options={{
          title: '내 기록',
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: -5,
          },
          tabBarIcon: ({ color }) => (
            <FontAwesome6 size={28} name="chart-area" color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Three"
        component={RankingView}
        options={{
          title: '랭킹보기',
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: -5,
          },
          tabBarIcon: ({ color }) => (
              <FontAwesome6 size={28} name="chart-simple" color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Four"
        component={SettingView}
        options={{
          title: '설정',
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: -5,
          },
          tabBarIcon: ({ color }) => (
            <FontAwesome6 size={28} name="gear" color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}