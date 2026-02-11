import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

// Translations
const translations = {
  en: {
    // Common
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    loading: 'Loading...',

    // Header
    projects: 'Projects',
    myProjects: 'My Projects',
    welcome: 'Welcome',

    // Profile Panel
    userProfile: 'User Profile',
    profile: 'Profile',
    settings: 'Settings',
    changePhoto: 'Change Photo',
    username: 'Username',
    usernameCannotChange: 'Username cannot be changed',
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name',
    saveChanges: 'Save Changes',
    accountSettings: 'Account Settings',
    changePassword: 'Change Password',
    updateLoginPassword: 'Update login password',
    change: 'Change',
    notifications: 'Notifications',
    manageEmailNotifications: 'Manage email notifications',
    interfaceLanguage: 'Interface Language',
    dangerZone: 'Danger Zone',
    dangerZoneWarning: 'These actions are irreversible. Be careful.',
    deleteAccount: 'Delete Account',
    logout: 'Logout',

    // Dashboard
    newProject: 'New Project',
    createNewProject: 'Create New Project',
    projectName: 'Project Name',
    description: 'Description',
    optional: 'Optional',
    optionalDescription: 'Optional description',
    scaleType: 'Scale Type',
    integerScale: 'Integer (1-9)',
    balancedScale: 'Balanced',
    powerScale: 'Power',
    maZhengScale: 'Ma-Zheng',
    doneganScale: 'Donegan',
    alternatives: 'Alternatives',
    minimum2Alternatives: 'Minimum 2 alternatives',
    addAlternative: 'Add Alternative',
    alternative: 'Alternative',
    remove: 'Remove',
    createProject: 'Create Project',
    noProjectsYet: 'No projects yet',
    createFirstProject: 'Create your first pairwise comparison project to begin',
    open: 'Open',
    updated: 'Updated',
    comparisons: 'Comparisons',

    // Project Detail
    projectSettings: 'Settings',
    collaborativeProject: 'Collaborative Project',
    yourProgress: 'Your Progress',
    progress: 'Progress',
    comparisonsCompleted: 'comparisons completed',
    startComparisons: 'Start Comparisons',
    continueComparisons: 'Continue Comparisons',
    viewResults: 'View Results',
    calculateResults: 'Calculate Results',

    // Comparison Workflow
    backToProject: 'Back to Project',
    comparison: 'Comparison',
    of: 'of',
    whatIsMoreImportant: 'What is more important?',
    alternativeA: 'Alternative A',
    alternativeB: 'Alternative B',
    versus: 'versus',
    selectMoreImportant: 'Select which alternative is MORE important:',
    moreImportant: 'more important',

    // Results
    aggregatedResults: 'Aggregated Results',
    combinedAssessments: 'Combined assessments from',
    experts: 'experts',
    updateResults: 'Update Results',
    pairwiseComparisonMatrices: 'Pairwise Comparison Matrices',
    finalAggregatedResults: 'Final Aggregated Results',
    consistency: 'Consistency',
    acceptable: 'Acceptable',
    needsReview: 'Needs Review',

    // Status badges
    statusInput: 'Input',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',

    // Dashboard filters
    projectType: 'Project Type',
    status: 'Status',
    all: 'All',
    individual: 'Individual',
    collaborative: 'Collaborative',
    inProgress: 'In Progress',
    completed: 'Completed',
    noMatchingProjects: 'No matching projects',
    tryDifferentFilters: 'Try different filters or create a new project',
    loadingProjects: 'Loading projects...',

    // Profile
    profileUpdated: 'Profile successfully updated',
    profileUpdateError: 'Error saving profile',
    saving: 'Saving...',
    avatarUrl: 'Avatar URL',
    enterImageUrl: 'Enter image URL',
  },
  ua: {
    // Common
    back: 'Назад',
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    create: 'Створити',
    loading: 'Завантаження...',

    // Header
    projects: 'Проєкти',
    myProjects: 'Мої проєкти',
    welcome: 'Вітаємо',

    // Profile Panel
    userProfile: 'Профіль користувача',
    profile: 'Профіль',
    settings: 'Налаштування',
    changePhoto: 'Змінити фото',
    username: "Ім'я користувача",
    usernameCannotChange: "Ім'я користувача не можна змінити",
    email: 'Електронна пошта',
    firstName: "Ім'я",
    lastName: 'Прізвище',
    saveChanges: 'Зберегти зміни',
    accountSettings: 'Налаштування акаунта',
    changePassword: 'Змінити пароль',
    updateLoginPassword: 'Оновити пароль для входу',
    change: 'Змінити',
    notifications: 'Сповіщення',
    manageEmailNotifications: 'Керувати email-сповіщеннями',
    interfaceLanguage: 'Мова інтерфейсу',
    dangerZone: 'Небезпечна зона',
    dangerZoneWarning: 'Ці дії незворотні. Будьте обережні.',
    deleteAccount: 'Видалити акаунт',
    logout: 'Вийти з акаунта',

    // Dashboard
    newProject: 'Новий проєкт',
    createNewProject: 'Створити новий проєкт',
    projectName: 'Назва проєкту',
    description: 'Опис',
    optional: 'Необов\'язково',
    optionalDescription: 'Необов\'язковий опис',
    scaleType: 'Тип шкали',
    integerScale: 'Цілочисельна (1-9)',
    balancedScale: 'Збалансована',
    powerScale: 'Степенева',
    maZhengScale: 'Ma-Zheng',
    doneganScale: 'Donegan',
    alternatives: 'Альтернативи',
    minimum2Alternatives: 'Мінімум 2 альтернативи',
    addAlternative: 'Додати альтернативу',
    alternative: 'Альтернатива',
    remove: 'Видалити',
    createProject: 'Створити проєкт',
    noProjectsYet: 'Поки немає проєктів',
    createFirstProject: 'Створіть свій перший проєкт попарного порівняння, щоб почати',
    open: 'Відкрити',
    updated: 'Оновлено',
    comparisons: 'Порівняння',

    // Project Detail
    projectSettings: 'Налаштування',
    collaborativeProject: 'Колективний проєкт',
    yourProgress: 'Ваш прогрес',
    progress: 'Прогрес',
    comparisonsCompleted: 'порівнянь завершено',
    startComparisons: 'Почати порівняння',
    continueComparisons: 'Продовжити порівняння',
    viewResults: 'Переглянути результати',
    calculateResults: 'Розрахувати результати',

    // Comparison Workflow
    backToProject: 'Назад до проєкту',
    comparison: 'Порівняння',
    of: 'з',
    whatIsMoreImportant: 'Що важливіше?',
    alternativeA: 'Альтернатива А',
    alternativeB: 'Альтернатива Б',
    versus: 'проти',
    selectMoreImportant: 'Оберіть, яка альтернатива БІЛЬШ важлива:',
    moreImportant: 'важливіше',

    // Results
    aggregatedResults: 'Зведені результати',
    combinedAssessments: "Об'єднані оцінки від",
    experts: 'експертів',
    updateResults: 'Оновити результати',
    pairwiseComparisonMatrices: 'Матриці парних порівнянь',
    finalAggregatedResults: 'Підсумкові зведені результати',
    consistency: 'Узгодженість',
    acceptable: 'Прийнятно',
    needsReview: 'Потрібна перевірка',

    // Status badges
    statusInput: 'Введення',
    statusInProgress: 'В процесі',
    statusCompleted: 'Завершено',

    // Dashboard filters
    projectType: 'Тип проєкту',
    status: 'Статус',
    all: 'Усі',
    individual: 'Індивідуальні',
    collaborative: 'Колективні',
    inProgress: 'В процесі',
    completed: 'Завершені',
    noMatchingProjects: 'Немає проєктів, що відповідають фільтрам',
    tryDifferentFilters: 'Спробуйте змінити фільтри або створіть новий проєкт',
    loadingProjects: 'Завантаження проєктів...',

    // Profile
    profileUpdated: 'Профіль успішно оновлено',
    profileUpdateError: 'Помилка при збереженні профілю',
    saving: 'Збереження...',
    avatarUrl: 'URL аватара',
    enterImageUrl: 'Введіть URL зображення',
  },
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to UA
    return localStorage.getItem('appLanguage') || 'ua'
  })

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('appLanguage', language)
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || key
  }

  const changeLanguage = (newLang) => {
    if (newLang === 'en' || newLang === 'ua') {
      setLanguage(newLang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
