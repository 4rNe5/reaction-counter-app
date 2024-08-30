import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { View } from 'react-native';
import { RootStackParamList } from '.';
import { HeaderButton } from '../components/HeaderButton';
import { TabBarIcon } from '../components/TabBarIcon';
import ReactionTestView from '../screens/ReactionTestView';
import RankingView from '../screens/RankingView';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const Tab = createBottomTabNavigator();

type Props = StackScreenProps<RootStackParamList, 'TabNavigator'>;

export default function TabLayout({ navigation }: Props) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#ff390d',
        tabBarStyle: {
          height: 80, // 전체 탭바의 높이를 증가
          borderRadius: 30,
          backgroundColor: '#323232',
          borderTopColor: 'transparent',
          position: 'absolute',
          paddingBottom: 20, // 하단 여백 추가
        },
        tabBarItemStyle: {
          padding: 5, // 각 탭 아이템의 패딩 조정
        },
      }}>
      <Tab.Screen
        name="reactionTestView"
        component={ReactionTestView}
        options={{
          title: '테스트하기',
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: 5, // 라벨과 아이콘 사이의 간격 조정
          },
          tabBarIcon: ({ color }) => (
              <FontAwesome6 size={28} name="fire-flame-simple" color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Two"
        component={RankingView}
        options={{
          title: '랭킹보기',
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: 5, // 라벨과 아이콘 사이의 간격 조정
          },
          tabBarIcon: ({ color }) => (
              <FontAwesome6 size={28} name="chart-simple" color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}