import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import LiveAttendancePage from './pages/LiveAttendancePage';
import StudentManagementPage from './pages/StudentManagementPage';
import ModelTrainingPage from './pages/ModelTrainingPage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ManualAttendancePage from './pages/ManualAttendancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import RegisterStudentModal from './components/RegisterStudentModal';
import StudentProfileModal from './components/StudentProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenStudentProfile = async (enrollment) => {
    try {
      const res = await fetch(`/api/students/${enrollment}`);
      if (res.ok) {
        setSelectedStudent(await res.json());
        setIsProfileModalOpen(true);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const getPageDetails = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Attendance statistics and system shortcuts' };
      case 'live-attendance':
        return { title: 'Live Face Recognition', subtitle: 'Automatic attendance scanning via camera' };
      case 'students':
        return { title: 'Student Management', subtitle: 'Student directory and biometric datasets' };
      case 'model-training':
        return { title: 'Recognition Model', subtitle: 'OpenCV LBPH Face Recognizer status and training' };
      case 'history':
        return { title: 'Attendance Records', subtitle: 'Filterable attendance historical logs' };
      case 'analytics':
        return { title: 'Analytics & Insights', subtitle: 'Visual attendance charts and daily trends' };
      case 'manual-attendance':
        return { title: 'Manual Attendance', subtitle: 'Manual entry and status overrides' };
      case 'reports':
        return { title: 'Reports & Exports', subtitle: 'Generate formatted CSV, Excel, and PDF reports' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'Configure recognition thresholds and camera source' };
      default:
        return { title: 'AttendAI', subtitle: 'Smart Face Recognition Attendance System' };
    }
  };

  const { title, subtitle } = getPageDetails();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Inter',sans-serif]">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={title}
          subtitle={subtitle}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
        />

        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setActiveTab}
              onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            />
          )}

          {activeTab === 'live-attendance' && (
            <LiveAttendancePage />
          )}

          {activeTab === 'students' && (
            <StudentManagementPage
              onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              onSelectStudent={handleOpenStudentProfile}
              onTrainModel={() => setActiveTab('model-training')}
            />
          )}

          {activeTab === 'model-training' && (
            <ModelTrainingPage />
          )}

          {activeTab === 'history' && (
            <AttendanceHistoryPage />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'manual-attendance' && (
            <ManualAttendancePage />
          )}

          {activeTab === 'reports' && (
            <ReportsPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              voiceEnabled={voiceEnabled}
              setVoiceEnabled={setVoiceEnabled}
            />
          )}
        </main>
      </div>

      {/* Register Student Modal Wizard */}
      <RegisterStudentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisteredSuccess={() => {}}
        onTrainModel={() => setActiveTab('model-training')}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRegisterNewSamples={() => setIsRegisterModalOpen(true)}
      />
    </div>
  );
}
