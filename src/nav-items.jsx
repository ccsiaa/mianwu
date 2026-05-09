import { HomeIcon, BookOpen, FileText, Mic, BarChart3, Type } from "lucide-react";
import Index from "./pages/Index.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import KnowledgeBase from "./pages/KnowledgeBase.jsx";
import ResumeWorkshop from "./pages/ResumeWorkshop.jsx";
import InterviewPrep from "./pages/InterviewPrep.jsx";
import InterviewReview from "./pages/InterviewReview.jsx";
import FontPreview from "./pages/FontPreview.jsx";

export const navItems = [
  { title: "首页", to: "/", icon: <HomeIcon className="h-4 w-4" />, page: <Index /> },
  { title: "登录", to: "/login", icon: <HomeIcon className="h-4 w-4" />, page: <Login /> },
  { title: "注册", to: "/register", icon: <HomeIcon className="h-4 w-4" />, page: <Register /> },
  { title: "知识库", to: "/knowledge", icon: <BookOpen className="h-4 w-4" />, page: <KnowledgeBase /> },
  { title: "简历工坊", to: "/resume", icon: <FileText className="h-4 w-4" />, page: <ResumeWorkshop /> },
  { title: "面试准备", to: "/interview", icon: <Mic className="h-4 w-4" />, page: <InterviewPrep /> },
  { title: "面试复盘", to: "/review", icon: <BarChart3 className="h-4 w-4" />, page: <InterviewReview /> },
  { title: "字体预览", to: "/fonts", icon: <Type className="h-4 w-4" />, page: <FontPreview /> },
];
