// src/iconsPaths.ts
import React, { FC } from 'react'; // Import the React module
import { SvgIconProps } from '@mui/material/SvgIcon';


// Lighting icons
import SunIcon from '@mui/icons-material/WbSunny';
import MoonIcon from '@mui/icons-material/NightsStay';

import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import EmailIcon from '@mui/icons-material/Email';
import ChatIcon from '@mui/icons-material/Chat';
import HeartIcon from '@mui/icons-material/Favorite';
import HospitalIcon from '@mui/icons-material/LocalHospital';
import MedicineIcon from '@mui/icons-material/LocalPharmacy';
import StethoscopeIcon from '@mui/icons-material/LocalPharmacy';
import AlertTriangleIcon from '@mui/icons-material/Warning';
import BellIcon from '@mui/icons-material/Notifications';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Security';
import AppleLoginIcon from '@mui/icons-material/Apple';
// Import the Azure icon
import AzureLoginIcon from '@mui/icons-material/Cloud'; // Example, replace with actual Azure icon
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import GoogleIcon from '@mui/icons-material/Google';
import GithubIcon from '@mui/icons-material/GitHub';
import SearchIcon from '@mui/icons-material/Search';
import PlusIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DashboardIcon from '@mui/icons-material/Dashboard';
import UserIcon from '@mui/icons-material/AccountCircle';
import FAQIcon from '@mui/icons-material/HelpOutline';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DiagnosisIcon from '@mui/icons-material/LocalHospital';
import DocumentationIcon from '@mui/icons-material/Description';
import DrawerIcon from '@mui/icons-material/Menu';
import InsightsIcon from '@mui/icons-material/Insights';
import LabsIcon from '@mui/icons-material/Biotech';
import EyeIcon from '@mui/icons-material/Visibility';
import ApiIcon from '@mui/icons-material/Api';
import SupportIcon from '@mui/icons-material/Support';
import BillingIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';
import SignupIcon from '@mui/icons-material/PersonAdd';
import QuestionIcon from '@mui/icons-material/QuestionAnswer';
import OrganizationIcon from '@mui/icons-material/Business';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

type IconProps = {
  className?: string;
};

type IconComponent = FC<SvgIconProps>;

interface IconComponentProps {
  [key: string]: IconComponent;
}

const iconComponents: IconComponentProps = {
  home: HomeIcon,
  info: InfoIcon,
  email: EmailIcon,
  chat: ChatIcon,
  heartbeat: HeartIcon,
  hospital: HospitalIcon,
  pill: MedicineIcon,
  stethoscope: StethoscopeIcon,
  alertTriangle: AlertTriangleIcon,
  bell: BellIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  lock: LockIcon,
  shield: ShieldIcon,
  appleLogin: AppleLoginIcon,
  microsoftLogin: AzureLoginIcon, // Replace with Azure icon
  twitter: TwitterIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  google: GoogleIcon,
  github: GithubIcon,
  search: SearchIcon,
  plus: PlusIcon,
  edit: EditIcon,
  dashboard: DashboardIcon,
  user: UserIcon,
  faq: FAQIcon,
  analytics: AnalyticsIcon,
  diagnosis: DiagnosisIcon,
  documentation: DocumentationIcon,
  drawer: DrawerIcon,
  insights: InsightsIcon,
  labs: LabsIcon,
  eye: EyeIcon,
  api: ApiIcon,
  support: SupportIcon,
  billing: BillingIcon,
  settings: SettingsIcon,
  signup: SignupIcon,
  question: QuestionIcon,
  organization: OrganizationIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  lightMode: SunIcon,
  darkMode: MoonIcon,
};

export default iconComponents;
