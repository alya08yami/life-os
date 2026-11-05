import type { Locale } from './index.ts';
export const templates = {
  quick: {
    ru:{name:'Быстрая уборка',tasks:['Убрать вещи по местам','Протереть поверхности','Вынести мусор']},
    uk:{name:'Швидке прибирання',tasks:['Розкласти речі по місцях','Протерти поверхні','Винести сміття']},
    en:{name:'Quick reset',tasks:['Put things back','Wipe surfaces','Take out the rubbish']}
  },
  weekly: {
    ru:{name:'Уборка на неделю',tasks:['Пропылесосить полы','Помыть ванную','Сменить постельное бельё','Протереть кухню']},
    uk:{name:'Щотижневе прибирання',tasks:['Пропилососити підлогу','Помити ванну','Змінити постільну білизну','Протерти кухню']},
    en:{name:'Weekly clean',tasks:['Vacuum the floors','Clean the bathroom','Change bed linen','Clean the kitchen']}
  },
  seasonal: {
    ru:{name:'Сезонные дела',tasks:['Проверить фильтры техники','Разобрать сезонную одежду','Проверить запасы для дома']},
    uk:{name:'Сезонні справи',tasks:['Перевірити фільтри техніки','Розібрати сезонний одяг','Перевірити запаси для дому']},
    en:{name:'Seasonal care',tasks:['Check appliance filters','Sort seasonal clothes','Review home supplies']}
  }
} satisfies Record<string,Record<Locale,{name:string;tasks:string[]}>>;
export type TemplateId=keyof typeof templates;
