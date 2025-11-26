import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation, route }) => {
  const { isDarkMode, toggleTheme } = React.useContext(ThemeContext);
  const { logout } = React.useContext(AuthContext);
  const [reminders, setReminders] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [todayReminders, setTodayReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedChartSection, setSelectedChartSection] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    loadReminders();
    setGreetingMessage();
  }, []);

  useEffect(() => {
    if (route.params?.newReminder || route.params?.refresh) {
      loadReminders();
      // Reset params to avoid infinite loops or stale state if needed,
      // though navigation.setParams might be needed if we want to clear it.
      // For now, just reloading is enough as the effect triggers on change.
    }
  }, [route.params?.newReminder, route.params?.refresh]);

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem('reminders');
      if (savedReminders) {
        try {
          const parsed = JSON.parse(savedReminders);
          if (Array.isArray(parsed)) {
            setReminders(parsed);
          } else {
            setReminders([]);
          }
        } catch (parseError) {
          console.error('Error parsing reminders JSON:', parseError);
          setReminders([]);
        }
      }
    } catch (error) {
      console.error('Error loading reminders from storage:', error);
      setReminders([]);
    }
  };

  const saveReminders = async (remindersList) => {
    try {
      if (!Array.isArray(remindersList)) {
        return;
      }
      await AsyncStorage.setItem('reminders', JSON.stringify(remindersList));
    } catch (error) {
      console.error('Error saving reminders:', error);
      Alert.alert('Error', 'Failed to save reminders. Please try again.');
    }
  };

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const toggleReminder = (id) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const deleteReminder = (id) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedReminders = reminders.filter((r) => r.id !== id);
          setReminders(updatedReminders);
          saveReminders(updatedReminders);
        },
      },
    ]);
  };

  const getReminderIcon = (type) => {
    const icons = {
      hourly: 'access-time',
      weekly: 'date-range',
      '15days': 'refresh',
      monthly: 'calendar-today',
      custom: 'settings',
    };
    return icons[type] || 'notifications';
  };

  const getReminderColor = (type) => {
    const colors = {
      hourly: ['#3B82F6', '#2563EB'],
      weekly: ['#10B981', '#059669'],
      '15days': ['#8B5CF6', '#7C3AED'],
      monthly: ['#F59E0B', '#D97706'],
      custom: ['#EF4444', '#DC2626'],
    };
    return colors[type] || ['#6B7280', '#4B5563'];
  };

  const getFilteredReminders = () => {
    // For Home screen, display all reminders sorted by creation date (newest first)
    if (activeTab === 'today') {
      // Show all reminders (ignoring date filter) to ensure visibility
      return [...reminders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    // Recents (last 5 added)
    return [...reminders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  };

  const displayedReminders = getFilteredReminders();

  const renderOverviewChart = () => {
    const activeCount = reminders.filter((r) => r.isActive).length;
    const inactiveCount = reminders.filter((r) => !r.isActive).length;
    const totalCount = reminders.length;
    const hourlyCount = reminders.filter((r) => r.type === 'hourly').length;
    const weeklyCount = reminders.filter((r) => r.type === 'weekly').length;
    const monthlyCount = reminders.filter((r) => r.type === 'monthly').length;
    const customCount = reminders.filter((r) => r.type === 'custom').length;
    const fifteenDaysCount = reminders.filter((r) => r.type === '15days').length;

    // Show only status data to avoid double counting
    const allData = [
      { count: activeCount, color: '#00FF87', label: 'Active' },
      { count: inactiveCount, color: '#FF3366', label: 'Inactive' },
      { count: hourlyCount, color: '#00D4FF', label: 'Hourly' },
      { count: weeklyCount, color: '#FFAA00', label: 'Weekly' },
      { count: monthlyCount, color: '#FF6B35', label: 'Monthly' },
      { count: fifteenDaysCount, color: '#8B5CF6', label: '15 Days' },
      { count: customCount, color: '#A8E6CF', label: 'Custom' },
    ];

    // Filter data to show only items with count > 0
    const filteredData = allData.filter((item) => item.count > 0);
    const totalWithData = filteredData.reduce((sum, item) => sum + item.count, 0);

    return (
      <View style={styles.overviewContainer}>
        <Text style={styles.overviewTitle}>Overview</Text>
        <View style={styles.chartRow}>
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChart}>
              {/* SVG Pie Chart - Show only items with count > 0 */}
              <Svg width={180} height={180} style={styles.svgPie} viewBox="0 0 180 180">
                {filteredData.map((item, index) => {
                  // Calculate angle for each segment
                  let currentAngle = filteredData.slice(0, index).reduce((sum, prev) => {
                    return sum + (prev.count / totalWithData) * 360;
                  }, 0);

                  const segmentAngle = (item.count / totalWithData) * 360;

                  const startRad = (currentAngle * Math.PI) / 180;
                  const endRad = ((currentAngle + segmentAngle) * Math.PI) / 180;

                  const centerX = 90;
                  const centerY = 90;
                  const radius = 70;

                  const x1 = centerX + radius * Math.cos(startRad);
                  const y1 = centerY + radius * Math.sin(startRad);
                  const x2 = centerX + radius * Math.cos(endRad);
                  const y2 = centerY + radius * Math.sin(endRad);

                  const largeArc = segmentAngle > 180 ? 1 : 0;
                  const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  return (
                    <Path
                      key={item.label}
                      d={pathData}
                      fill={item.color}
                      opacity={0.9}
                      strokeWidth="1"
                      stroke="white"
                    />
                  );
                })}

                {/* Center circle for donut effect */}
                <Circle cx={90} cy={90} r={35} fill="white" />
              </Svg>

              {/* Center text */}
              <View style={styles.pieCenter}>
                <Text style={styles.pieCenterNumber}>{totalCount}</Text>
                <Text style={styles.pieCenterLabel}>Total</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartLegend}>
            {/* Show ALL items with their counts - always visible */}
            <View style={styles.allLegendItems}>
              {allData.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.legendItem,
                    selectedChartSection?.label === item.label && styles.legendItemSelected,
                  ]}
                  onPress={() => setSelectedChartSection(item)}
                >
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.label}: {item.count}
                  </Text>
                  {selectedChartSection?.label === item.label && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>
                        {totalWithData > 0
                          ? Math.round((selectedChartSection.count / totalWithData) * 100)
                          : 0}
                        %
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderReminderItem = ({ item }) => {
    const colors = getReminderColor(item.type || 'custom');

    return (
      <TouchableOpacity
        style={[styles.reminderCard, isDarkMode && styles.reminderCardDark]}
        onPress={() => navigation.navigate('ReminderList', { reminderId: item.id })}
        activeOpacity={0.9}
      >
        <LinearGradient colors={colors} style={styles.reminderIcon}>
          <Icon name={getReminderIcon(item.type || 'custom')} size={18} color="white" />
        </LinearGradient>

        <View style={styles.reminderContent}>
          <Text style={[styles.reminderTitle, isDarkMode && styles.reminderTitleDark]}>
            {item.title}
          </Text>
          <Text style={[styles.reminderType, isDarkMode && styles.reminderTypeDark]}>
            {item.type || 'Custom'} • {item.category || 'General'}
          </Text>
        </View>

        <View style={styles.reminderActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleReminder(item.id)}>
            <Icon
              name={item.isActive ? 'toggle-on' : 'toggle-off'}
              size={28}
              color={item.isActive ? '#10B981' : '#9CA3AF'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => deleteReminder(item.id)}>
            <Icon name="delete-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.mainContent}>
        {/* Fixed Navbar */}
        <LinearGradient
          colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
          style={styles.navbar}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.logoButton}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.appLogo}>
                <Icon name="notifications" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.logoText}>RemindMe</Text>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
                <Icon name={isDarkMode ? 'light-mode' : 'dark-mode'} size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
                <Icon name="menu" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Overview Section - Scrollable */}
          <LinearGradient
            colors={isDarkMode ? ['#16213e', '#1a1a2e'] : ['#764BA2', '#667EEA']}
            style={styles.overviewHeader}
          >
            {renderOverviewChart()}
          </LinearGradient>
          {/* Reminders List with Inline Tabs */}
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Reminders
              </Text>
              <View style={styles.inlineTabContainer}>
                <TouchableOpacity
                  style={[styles.inlineTabButton, activeTab === 'today' && styles.activeTabButton]}
                  onPress={() => setActiveTab('today')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 'today' && styles.activeTabText,
                      isDarkMode && styles.tabTextDark,
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inlineTabButton,
                    activeTab === 'recents' && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab('recents')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 'recents' && styles.activeTabText,
                      isDarkMode && styles.tabTextDark,
                    ]}
                  >
                    Recents
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {displayedReminders.length > 0 ? (
              displayedReminders.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reminderCard,
                    !item.isActive && styles.reminderCardInactive,
                    isDarkMode && styles.reminderCardDark,
                  ]}
                  onPress={() => toggleReminder(item.id)}
                >
                  <View style={styles.reminderHeader}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: (item.color || '#667EEA') + '20' },
                      ]}
                    >
                      <Icon name={item.icon || 'label'} size={16} color={item.color || '#667EEA'} />
                      <Text style={[styles.categoryText, { color: item.color || '#667EEA' }]}>
                        {item.category || 'General'}
                      </Text>
                    </View>
                    <Text style={[styles.timeText, isDarkMode && styles.timeTextDark]}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.reminderBody}>
                    <Text
                      style={[
                        styles.reminderTitle,
                        !item.isActive && styles.textInactive,
                        isDarkMode && styles.reminderTitleDark,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text
                        style={[
                          styles.reminderDescription,
                          !item.isActive && styles.textInactive,
                          isDarkMode && styles.reminderDescriptionDark,
                        ]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.reminderActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleReminder(item.id)}
                    >
                      <Icon
                        name={item.isActive ? 'toggle-on' : 'toggle-off'}
                        size={28}
                        color={item.isActive ? '#10B981' : '#9CA3AF'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteReminder(item.id)}
                    >
                      <Icon name="delete-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="event-note" size={48} color="#CBD5E1" />
                <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                  No reminders found
                </Text>
              </View>
            )}
          </View>
          {/* Empty State */}
          {reminders.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="notifications-none" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Reminders Yet</Text>
              <Text style={styles.emptySubtitle}>Create your first reminder to get started</Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => navigation.navigate('CreateReminder')}
              >
                <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
                  <Icon name="add" size={20} color="white" />
                  <Text style={styles.createFirstText}>Create Reminder</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Footer Navigation Bar */}
      <View style={[styles.footerNav, isDarkMode && styles.footerNavDark]}>
        <TouchableOpacity style={styles.footerNavItem} onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={24} color="#667EEA" />
          <Text style={styles.footerNavLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => navigation.navigate('ReminderList')}
        >
          <Icon name="list" size={24} color="#9CA3AF" />
          <Text style={[styles.footerNavLabel, { color: '#9CA3AF' }]}>Reminders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createFooterButton}
          onPress={() => navigation.navigate('CreateReminder')}
        >
          <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.createFooterGradient}>
            <Icon name="add" size={32} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Icon name="calendar-today" size={24} color="#9CA3AF" />
          <Text style={[styles.footerNavLabel, { color: '#9CA3AF' }]}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={24} color="#9CA3AF" />
          <Text style={[styles.footerNavLabel, { color: '#9CA3AF' }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Dropdown with Overlay */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.menuOverlay}>
            <View style={[styles.menuDropdown, isDarkMode && styles.menuDropdownDark]}>
              <TouchableOpacity
                style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Profile');
                }}
              >
                <Icon name="person" size={20} color={isDarkMode ? '#bb86fc' : '#374151'} />
                <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Settings');
                }}
              >
                <Icon name="settings" size={20} color={isDarkMode ? '#bb86fc' : '#374151'} />
                <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Calendar');
                }}
              >
                <Icon name="help" size={20} color={isDarkMode ? '#bb86fc' : '#374151'} />
                <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>
                  Help & Support
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('About', 'RemindMe v1.0.0\nA beautiful reminder app');
                }}
              >
                <Icon name="info" size={20} color={isDarkMode ? '#bb86fc' : '#374151'} />
                <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>About</Text>
              </TouchableOpacity>
              <View style={[styles.menuDivider, isDarkMode && { backgroundColor: '#333333' }]} />
              <TouchableOpacity
                style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('Logout', 'Are you sure you want to logout?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Logout',
                      style: 'destructive',
                      onPress: async () => {
                        const result = await logout();
                        if (!result.success) {
                          Alert.alert('Error', result.error);
                        }
                      },
                    },
                  ]);
                }}
              >
                <Icon name="logout" size={20} color="#EF4444" />
                <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  mainContent: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  navbar: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
    elevation: 5,
  },
  overviewHeader: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  appLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  menuButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewContainer: {
    marginTop: 0,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  pieChartContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pieChart: {
    width: 180,
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgPie: {
    position: 'absolute',
  },
  pieSlice: {
    position: 'absolute',
    width: 180,
    height: 180,
  },
  pieArc: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 30,
    borderColor: 'transparent',
  },
  pieCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: 100,
    height: 100,
    borderRadius: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#F1F5F9',
  },
  pieCenterNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  pieCenterLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  chartLegend: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 8,
    justifyContent: 'center',
  },
  allLegendItems: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    elevation: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  selectedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 35,
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
  },
  greetingSection: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  greetingSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  inlineTabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineTabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },

  activeTabButton: {
    backgroundColor: '#667EEA',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: 'white',
  },
  tabTextDark: {
    color: '#E5E7EB', // Lighter gray for better visibility
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingBottom: 20, // Extra padding for bottom
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 80,
  },
  footerNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    flex: 1,
  },
  createFooterButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  createFooterGradient: {
    width: 50, // Slightly smaller to fit inline
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667EEA',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 10, // Reduced top padding
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8, // Add top margin for better spacing
    paddingVertical: 8, // Ensure title has breathing room
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667EEA',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seeAllButton: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },

  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Align content and actions
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#667EEA',
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center', // Vertically center text
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reminderType: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  reminderBody: {
    marginBottom: 8,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  textInactive: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  reminderCardInactive: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  createFirstButton: {
    marginTop: 24,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuDropdown: {
    position: 'absolute',
    top: 60, // Adjusted to be closer to the button
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    width: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 16,
  },
  selectedInfo: {
    display: 'none',
  },
  selectedTitle: {
    display: 'none',
  },
  selectedCount: {
    display: 'none',
  },
  selectedPercentage: {
    display: 'none',
  },
  clearSelection: {
    display: 'none',
  },
  clearText: {
    display: 'none',
  },

  // Dark Mode Styles
  containerDark: {
    backgroundColor: '#0a0e27',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    padding: 8,
    marginRight: 4,
  },
  greetingSectionDark: {
    backgroundColor: '#1a1f3a',
    borderWidth: 1,
    borderColor: '#2a2f4a',
  },
  greetingTextDark: {
    color: '#ffffff',
  },
  greetingSubtextDark: {
    color: '#c0c8e0',
  },
  sectionDark: {
    backgroundColor: '#0a0e27',
  },
  sectionTitleDark: {
    color: '#ffffff',
  },

  reminderCardDark: {
    backgroundColor: '#2d3748', // Lighter dark background for cards
    borderLeftColor: '#bb86fc',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  reminderTitleDark: {
    color: '#F9FAFB', // Almost white
  },
  reminderTypeDark: {
    color: '#D1D5DB', // Light gray
  },
  reminderDescriptionDark: {
    color: '#E5E7EB', // Lighter gray
  },
  timeTextDark: {
    color: '#E5E7EB', // Lighter gray
  },
  emptyTextDark: {
    color: '#D1D5DB',
  },
  emptyTitleDark: {
    color: '#F9FAFB',
  },
  emptySubtitleDark: {
    color: '#9CA3AF',
  },
  footerNavDark: {
    backgroundColor: '#1a1f3a',
    borderTopColor: '#3a4560',
    borderTopWidth: 1,
  },
  menuDropdownDark: {
    backgroundColor: '#2d3748', // Match card background
    borderColor: '#4B5563',
    borderWidth: 1,
  },
  menuItemDark: {
    borderBottomColor: '#4B5563',
  },
  menuTextDark: {
    color: '#F9FAFB',
  },
});

export default HomeScreen;
