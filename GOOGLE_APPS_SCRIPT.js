// =====================================================
// ЭТОТ КОД НУЖНО ВСТАВИТЬ В GOOGLE APPS SCRIPT
// Инструкция — в файле НАСТРОЙКА_GOOGLE_ТАБЛИЦЫ.txt
// =====================================================

// === НАСТРОЙКИ ===
var TELEGRAM_BOT_TOKEN = 'ВСТАВЬТЕ_ТОКЕН_БОТА';  // Получить у @BotFather
var TELEGRAM_CHAT_ID = 'ВСТАВЬТЕ_CHAT_ID';        // Получить у @userinfobot

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var type = data.type || 'quiz';

    if (type === 'quiz') {
      saveQuizLead(sheet, data);
      sendTelegramQuiz(data);
    } else if (type === 'contact') {
      saveContactMessage(sheet, data);
      sendTelegramContact(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// === СОХРАНЕНИЕ В ТАБЛИЦУ ===

function saveQuizLead(sheet, data) {
  var quizSheet = sheet.getSheetByName('Заявки с квиза');
  if (!quizSheet) {
    quizSheet = sheet.insertSheet('Заявки с квиза');
    quizSheet.appendRow(['Дата', 'Телефон', 'Опыт эпиляции', 'Зоны', 'Цвет волос', 'Когда планирует']);
    quizSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f0c850');
    quizSheet.setFrozenRows(1);
    quizSheet.setColumnWidth(1, 150);
    quizSheet.setColumnWidth(2, 180);
  }

  var answers = data.answers || {};
  var experienceMap = {
    'never': 'Нет, хочу впервые',
    'continue': 'Да, продолжаю курс',
    'bad': 'Был неудачный опыт'
  };
  var zoneMap = {
    'bikini': 'Бикини',
    'armpits': 'Подмышки',
    'legs': 'Ноги',
    'complex': 'Комплекс',
    'other': 'Другая зона'
  };
  var hairMap = {
    'dark': 'Темный/черный',
    'brown': 'Каштановый/коричневый'
  };
  var whenMap = {
    'this_week': 'На этой неделе',
    'this_month': 'В этом месяце',
    'just_look': 'Просто узнаю цену'
  };

  var zones = '';
  if (Array.isArray(answers['2'])) {
    zones = answers['2'].map(function(z) { return zoneMap[z] || z; }).join(', ');
  }

  quizSheet.appendRow([
    new Date(),
    data.phone || '',
    experienceMap[answers['1']] || answers['1'] || '',
    zones,
    hairMap[answers['3']] || answers['3'] || '',
    whenMap[answers['4']] || answers['4'] || ''
  ]);
}

function saveContactMessage(sheet, data) {
  var contactSheet = sheet.getSheetByName('Обратная связь');
  if (!contactSheet) {
    contactSheet = sheet.insertSheet('Обратная связь');
    contactSheet.appendRow(['Дата', 'Имя', 'Email', 'Сообщение']);
    contactSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f0c850');
    contactSheet.setFrozenRows(1);
  }

  contactSheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.message || ''
  ]);
}

// === ОТПРАВКА В TELEGRAM ===

function sendTelegramQuiz(data) {
  if (TELEGRAM_BOT_TOKEN === 'ВСТАВЬТЕ_ТОКЕН_БОТА') return;

  var answers = data.answers || {};
  var experienceMap = {
    'never': 'Впервые',
    'continue': 'Продолжает курс',
    'bad': 'Был неудачный опыт'
  };
  var zoneMap = {
    'bikini': 'Бикини',
    'armpits': 'Подмышки',
    'legs': 'Ноги',
    'complex': 'Комплекс',
    'other': 'Другая зона'
  };
  var whenMap = {
    'this_week': 'На этой неделе!',
    'this_month': 'В этом месяце',
    'just_look': 'Узнает цену'
  };

  var zones = '';
  if (Array.isArray(answers['2'])) {
    zones = answers['2'].map(function(z) { return zoneMap[z] || z; }).join(', ');
  }

  var hot = answers['4'] === 'this_week' ? ' ГОРЯЧАЯ ЗАЯВКА' : '';

  var text = hot + ' НОВАЯ ЗАЯВКА С КВИЗА\n\n'
    + 'Телефон: ' + (data.phone || '---') + '\n'
    + 'Опыт: ' + (experienceMap[answers['1']] || '---') + '\n'
    + 'Зоны: ' + (zones || '---') + '\n'
    + 'Волосы: ' + (answers['3'] || '---') + '\n'
    + 'Когда: ' + (whenMap[answers['4']] || '---');

  sendTelegram(text);
}

function sendTelegramContact(data) {
  if (TELEGRAM_BOT_TOKEN === 'ВСТАВЬТЕ_ТОКЕН_БОТА') return;

  var text = ' СООБЩЕНИЕ С САЙТА\n\n'
    + 'Имя: ' + (data.name || '---') + '\n'
    + 'Email: ' + (data.email || '---') + '\n'
    + 'Сообщение: ' + (data.message || '---');

  sendTelegram(text);
}

function sendTelegram(text) {
  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'HTML'
    })
  });
}

// === ТЕСТОВАЯ ФУНКЦИЯ ===
function testQuizSubmit() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        type: 'quiz',
        phone: '+7 (999) 123-45-67',
        answers: { '1': 'never', '2': ['bikini', 'armpits'], '3': 'dark', '4': 'this_week' },
        source: 'quiz_landing'
      })
    }
  };
  var result = doPost(testData);
  Logger.log(result.getContent());
}

function testContactSubmit() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        type: 'contact',
        name: 'Тест',
        email: 'test@test.ru',
        message: 'Тестовое сообщение'
      })
    }
  };
  var result = doPost(testData);
  Logger.log(result.getContent());
}
