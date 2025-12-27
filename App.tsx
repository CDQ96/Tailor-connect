import React from 'react';
import { AppProvider, useApp } from './store';
import { AppView } from './types';
import { Layout } from './components/Layout';
import { 
  LandingView, 
  AuthView, 
  CustomerDashboard, 
  TailorDetails,
  MeasurementView,
  TrackingView,
  TailorDashboard,
  ChatView,
  PaymentView,
  AppointmentView,
  ProfileView,
  LiveStylistView,
  VirtualFittingView,
  FabricScannerView
} from './components/Views';

const Main = () => {
  const { view } = useApp();

  const renderView = () => {
    switch (view) {
      case AppView.LANDING:
        return <LandingView />;
      case AppView.AUTH:
        return <AuthView />;
      case AppView.CUSTOMER_DASHBOARD:
        return <CustomerDashboard />;
      case AppView.TAILOR_DETAILS:
        return <TailorDetails />;
      case AppView.MEASUREMENT:
        return <MeasurementView />;
      case AppView.TRACKING:
        return <TrackingView />;
      case AppView.TAILOR_DASHBOARD:
        return <TailorDashboard />;
      case AppView.CHAT:
        return <ChatView />;
      case AppView.PAYMENT:
        return <PaymentView />;
      case AppView.APPOINTMENTS:
        return <AppointmentView />;
      case AppView.PROFILE:
        return <ProfileView />;
      case AppView.LIVE_STYLIST:
        return <LiveStylistView />;
      case AppView.VIRTUAL_FITTING:
        return <VirtualFittingView />;
      case AppView.FABRIC_SCANNER:
        return <FabricScannerView />;
      default:
        return <LandingView />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
};

export default App;