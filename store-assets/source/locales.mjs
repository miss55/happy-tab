// Store copy and fictional sample records. Product UI translations remain in the app.
export const locales = {
  'zh-TW': {
    native: '繁體中文', font: 'Microsoft JhengHei', cjk: true, series: '書籤管理員',
    groups: ['工作', '設計', '開發', '閱讀', '研究', '日常'],
    links: [
      ['專案工作區','團隊檔案','迭代看板','團隊討論'],
      ['產品設計','設計靈感','配色方案','攝影素材'],
      ['我的程式碼儲存庫','Web 開發文件','開發指南','建置工具'],
      ['科技資訊','每日閱讀','精選文章','前端筆記'],
      ['參考資料','學術論文','靈感收藏','Web 思考'],
      ['收件匣','每週行程','稍後觀看','專注歌單']
    ],
    tabs: ['品牌設計探索','程式碼合併請求','會議筆記','CSS 網格排版','工作區靈感','新配色方案','最新資訊'],
    overview: {
      title: ['分頁與書籤，','井然有序。'], sub: '打開新分頁，就是你的書籤工作區。',
      features: ['預設儲存在本機','無需註冊登入','支援 8 種介面語言'], tag: '新分頁，從此有序'
    },
    drag: {
      eyebrow: '告別分頁堆積', title: ['輕輕一拖，','留住好連結。'],
      sub: ['把開啟的分頁拖進群組，','下次打開，依然找得到。'],
      steps: ['選取開啟的分頁','拖入你的書籤群組','下次造訪，隨手找到'],
      features: ['儲存在目前裝置','自由整理你的群組'], tag: '此刻開啟，留待下次'
    },
    themes: {
      title: ['你的新分頁，','你的風格。'], sub: '同一個工作區，換一種好心情。',
      labels: ['柔和 / 淺色','柔和 / 深色','毛玻璃 / 淺色'],
      descriptions: ['明亮清爽，開啟一天的工作。','柔和深色，讓工作區安靜下來。','霧面卡片，搭配你喜歡的背景。'],
      features: ['6 種介面風格','自訂強調色','內建桌布與自選背景'], tag: '讓常用的頁面，也合你心意'
    },
    backup: {
      eyebrow: '預設儲存在本機', title: ['你的書籤，','由你掌控。'],
      sub: ['預設儲存在目前裝置。','需要時，隨時備份。'],
      steps: ['無需註冊 Tabvia 帳號','匯出可攜式 JSON 備份','支援合併或覆寫還原'],
      features: ['無需登入，即刻使用','本機匯入與匯出'], tag: '留好備份，資料在手'
    },
    sync: {
      eyebrow: '按需啟用雲端同步', title: ['要不要同步，','由你決定。'],
      sub: ['將資料快照存到你信任的雲端空間。','是否連線、連到哪裡，都由你選擇。'],
      custom: '自訂 REST API', notice: '不啟用，就不同步。',
      detail: '不連接雲端，也能完整使用本機工作區。',
      features: ['連接你自己的儲存服務','同步由你主動啟用'], tag: '預設本機，可選雲端'
    }
  },
  ja: {
    native: '日本語', font: 'Yu Gothic', cjk: true, series: 'ブックマーク管理',
    groups: ['仕事','デザイン','開発','読む','調べる','日常'],
    links: [
      ['プロジェクト拠点','チームのファイル','スプリント管理','チームの会話'],
      ['プロダクトデザイン','デザインのヒント','配色パレット','写真素材'],
      ['マイリポジトリ','Web 開発ドキュメント','開発ガイド','ビルドツール'],
      ['テクノロジー','今日の読み物','注目の記事','フロントエンドのメモ'],
      ['参考資料','学術論文','アイデア収集','Web の考察'],
      ['受信トレイ','今週の予定','後で見る','集中プレイリスト']
    ],
    tabs: ['ブランドのアイデア','プルリクエスト','会議メモ','CSS グリッド','作業環境のヒント','新しい配色','最新ニュース'],
    overview: {
      title: ['タブもブックマークも、','すっきり整理。'], sub: '新しいタブを、いつものブックマークの定位置に。',
      features: ['標準ではローカル保存','アカウント不要','8 言語のインターフェース'], tag: '新しいタブから、すっきりと'
    },
    drag: {
      eyebrow: '増えすぎたタブを整理', title: ['タブをドラッグ。','リンクを保存。'],
      sub: ['開いているタブをグループへ。','次に使うときも、すぐ見つかります。'],
      steps: ['開いているタブを選ぶ','好きなグループへドラッグ','次のアクセスもスムーズに'],
      features: ['この端末に保存','グループは自由に整理'], tag: '今開いたページを、また今度も'
    },
    themes: {
      title: ['新しいタブを、','自分らしく。'], sub: 'いつものワークスペースに、気分に合う見た目を。',
      labels: ['ソフト / ライト','ソフト / ダーク','ガラス / ライト'],
      descriptions: ['明るく、すっきりとした作業空間。','落ち着いた色で、静かな作業時間。','すりガラス風のカードと好きな背景。'],
      features: ['6 つのスタイル','アクセントカラーを変更','内蔵壁紙・好きな背景画像'], tag: '毎日使う場所を、お気に入りに'
    },
    backup: {
      eyebrow: '標準ではローカル保存', title: ['ブックマークも、','データも自分で。'],
      sub: ['データはこの端末に保存。','必要なときに、すぐバックアップ。'],
      steps: ['Tabvia アカウントは不要','JSON 形式でバックアップ','統合・置き換えで復元'],
      features: ['ログインせずに使える','ローカルで入出力'], tag: '手元にコピーを。管理も自分で。'
    },
    sync: {
      eyebrow: 'クラウド同期は任意', title: ['同期するかも、','保存先も自由。'],
      sub: ['信頼できるストレージにスナップショットを。','接続するかどうかも、自分で選べます。'],
      custom: 'カスタム REST API', notice: '有効にするまで同期しません。',
      detail: 'クラウドに接続せず、ローカルで使えます。',
      features: ['自分のストレージに接続','同期の開始は自分で選択'], tag: '基本はローカル。クラウドは任意。'
    }
  },
  ko: {
    native: '한국어', font: 'Malgun Gothic', cjk: true, series: '북마크 관리',
    groups: ['업무','디자인','개발','읽을거리','리서치','일상'],
    links: [
      ['프로젝트 허브','팀 파일','스프린트 보드','팀 대화'],
      ['제품 디자인','디자인 영감','색상 팔레트','사진 자료'],
      ['내 저장소','웹 개발 문서','개발 가이드','빌드 도구'],
      ['기술 소식','오늘의 읽을거리','추천 글','프런트엔드 메모'],
      ['참고 자료','학술 논문','아이디어 모음','웹에 관한 생각'],
      ['받은편지함','주간 일정','나중에 볼 영상','집중 플레이리스트']
    ],
    tabs: ['브랜드 아이디어','풀 리퀘스트','회의 메모','CSS 그리드','작업 공간 아이디어','새 색상 팔레트','최신 소식'],
    overview: {
      title: ['탭과 북마크를, ','한눈에 깔끔하게.'], sub: '새 탭을 열면, 나만의 북마크 작업 공간이 펼쳐집니다.',
      features: ['기본은 로컬 저장','계정 없이 바로 사용','8개 언어 지원'], tag: '새 탭부터, 깔끔하게'
    },
    drag: {
      eyebrow: '쌓이는 탭을 간편하게 정리', title: ['탭을 끌어,','링크로 보관.'],
      sub: ['열린 탭을 그룹으로 끌어 놓으세요.','다음에도 쉽게 찾을 수 있습니다.'],
      steps: ['열린 탭 선택하기','원하는 그룹에 끌어 놓기','다음에 다시 찾아보기'],
      features: ['현재 기기에 저장','그룹을 자유롭게 정리'], tag: '지금 연 페이지를, 다음에도'
    },
    themes: {
      title: ['새 탭도, ','내 취향대로.'], sub: '같은 작업 공간, 기분에 맞는 새로운 모습.',
      labels: ['소프트 / 밝게','소프트 / 어둡게','글래스 / 밝게'],
      descriptions: ['밝고 깔끔하게 시작하는 하루.','차분한 색으로 편안한 작업 공간.','반투명 카드에 원하는 배경을 더해요.'],
      features: ['6가지 스타일','강조 색상 설정','기본 배경과 내 이미지'], tag: '매일 여는 공간을, 나답게'
    },
    backup: {
      eyebrow: '기본은 로컬 저장', title: ['내 북마크,','내가 관리해요.'],
      sub: ['데이터는 현재 기기에 저장됩니다.','필요할 때 언제든 백업하세요.'],
      steps: ['Tabvia 계정 없이 사용','이동 가능한 JSON 백업','병합 또는 덮어쓰기로 복원'],
      features: ['로그인 없이 바로 시작','로컬 가져오기·내보내기'], tag: '백업도, 데이터 관리도 내 손으로'
    },
    sync: {
      eyebrow: '클라우드 동기화는 선택', title: ['동기화도,','내가 결정해요.'],
      sub: ['신뢰하는 저장소에 스냅샷을 보관하세요.','연결 여부와 저장 위치는 직접 선택합니다.'],
      custom: '사용자 지정 REST API', notice: '켜기 전에는 동기화하지 않아요.',
      detail: '클라우드 없이도 로컬 작업 공간을 사용할 수 있어요.',
      features: ['내 저장소에 연결','동기화는 직접 켤 때만'], tag: '기본은 로컬, 클라우드는 선택'
    }
  },
  es: {
    native: 'Español', font: 'Segoe UI', cjk: false, series: 'GESTOR DE MARCADORES',
    groups: ['Trabajo','Diseño','Desarrollo','Lecturas','Investigación','Día a día'],
    links: [
      ['Centro del proyecto','Archivos del equipo','Tablero del sprint','Conversaciones del equipo'],
      ['Diseño de producto','Ideas de diseño','Paletas de colores','Fotografía'],
      ['Mis repositorios','Documentación web','Guía de desarrollo','Herramientas de compilación'],
      ['Tecnología','Lecturas del día','Artículos destacados','Notas de frontend'],
      ['Referencias','Artículos académicos','Colecciones','Ideas sobre la web'],
      ['Bandeja de entrada','Mi semana','Ver más tarde','Música para concentrarse']
    ],
    tabs: ['Ideas de marca','Solicitudes de cambios','Notas de reunión','CSS Grid','Ideas para el escritorio','Nueva paleta','Últimas noticias'],
    overview: {
      title: ['Pestañas y marcadores, ','en orden.'], sub: 'Tu espacio de marcadores, en cada nueva pestaña.',
      features: ['Guardado local por defecto','Sin cuenta','Interfaz en 8 idiomas'], tag: 'TU NUEVA PESTAÑA, EN ORDEN'
    },
    drag: {
      eyebrow: 'MENOS PESTAÑAS ACUMULADAS', title: ['Arrastra una pestaña.','Guarda el enlace.'],
      sub: ['Lleva una pestaña abierta a un grupo.','La encontrarás en tu próxima visita.'],
      steps: ['Elige una pestaña abierta','Arrástrala a tu grupo','Encuéntrala la próxima vez'],
      features: ['Guardado en tu dispositivo','Grupos a tu manera'], tag: 'ABRE HOY. CONSERVA PARA DESPUÉS.'
    },
    themes: {
      title: ['Una nueva pestaña ','a tu gusto.'], sub: 'El mismo espacio. Un estilo diferente.',
      labels: ['Suave / Claro','Suave / Oscuro','Cristal / Claro'],
      descriptions: ['Claridad para empezar el día.','Un entorno tranquilo para trabajar.','Tarjetas translúcidas sobre tu fondo.'],
      features: ['6 estilos visuales','Colores de acento','Fondos incluidos o propios'], tag: 'DALE TU PROPIO ESTILO'
    },
    backup: {
      eyebrow: 'LOCAL POR DEFECTO', title: ['Tus marcadores.','Tus datos.'],
      sub: ['Guardados en tu dispositivo.','Haz una copia cuando la necesites.'],
      steps: ['Sin cuenta de Tabvia','Exporta una copia JSON','Restaura: fusiona o reemplaza'],
      features: ['Empieza sin iniciar sesión','Importa y exporta en local'], tag: 'UNA COPIA. TODO BAJO TU CONTROL.'
    },
    sync: {
      eyebrow: 'SINCRONIZACIÓN OPCIONAL', title: ['Sincroniza','a tu manera.'],
      sub: ['Guarda una instantánea donde tú decidas.','Tú eliges si te conectas y a qué servicio.'],
      custom: 'API REST propia', notice: 'Sin sincronizar hasta que la actives.',
      detail: 'Tu espacio local funciona sin conexión a la nube.',
      features: ['Conecta tu propio servicio','Tú activas la sincronización'], tag: 'LOCAL PRIMERO. NUBE OPCIONAL.'
    }
  },
  fr: {
    native: 'Français', font: 'Segoe UI', cjk: false, series: 'GESTIONNAIRE DE FAVORIS',
    groups: ['Travail','Design','Développement','Lectures','Recherche','Quotidien'],
    links: [
      ['Espace du projet','Fichiers de l’équipe','Tableau de sprint','Échanges de l’équipe'],
      ['Design produit','Idées créatives','Palettes de couleurs','Photographie'],
      ['Mes dépôts','Documentation web','Guide de développement','Outils de compilation'],
      ['Technologie','Lectures du jour','Articles à découvrir','Notes frontend'],
      ['Références','Articles scientifiques','Collections','Réflexions sur le web'],
      ['Boîte de réception','Ma semaine','À regarder plus tard','Musique pour se concentrer']
    ],
    tabs: ['Pistes de marque','Demandes de fusion','Notes de réunion','Grille CSS','Idées pour le bureau','Nouvelle palette','Dernières actualités'],
    overview: {
      title: ['Onglets et favoris, ','bien rangés.'], sub: 'Vos favoris trouvent leur place dans chaque nouvel onglet.',
      features: ['Stockage local par défaut','Sans compte','Interface en 8 langues'], tag: 'UN NOUVEL ONGLET BIEN ORDONNÉ'
    },
    drag: {
      eyebrow: 'MOINS D’ONGLETS OUVERTS', title: ['Glissez un onglet.','Gardez le lien.'],
      sub: ['Déposez un onglet ouvert dans un groupe.','Retrouvez-le lors de votre prochaine visite.'],
      steps: ['Choisissez un onglet ouvert','Glissez-le dans votre groupe','Retrouvez-le la prochaine fois'],
      features: ['Enregistré sur votre appareil','Des groupes à votre façon'], tag: 'OUVERT AUJOURD’HUI. GARDÉ POUR DEMAIN.'
    },
    themes: {
      title: ['Un nouvel onglet ','à votre image.'], sub: 'Le même espace. Une autre ambiance.',
      labels: ['Doux / Clair','Doux / Sombre','Verre / Clair'],
      descriptions: ['Un espace clair pour commencer la journée.','Une ambiance calme pour travailler.','Des cartes givrées sur votre fond préféré.'],
      features: ['6 styles visuels','Couleurs d’accent','Fonds intégrés ou personnels'], tag: 'FAITES PLACE À VOTRE STYLE'
    },
    backup: {
      eyebrow: 'LOCAL PAR DÉFAUT', title: ['Vos favoris.','Vos données.'],
      sub: ['Conservés sur votre appareil.','Sauvegardez-les quand vous le souhaitez.'],
      steps: ['Aucun compte Tabvia requis','Exportez une sauvegarde JSON','Restaurez : fusion ou remplacement'],
      features: ['Commencez sans vous connecter','Import et export en local'], tag: 'UNE COPIE. LE CONTRÔLE EN PLUS.'
    },
    sync: {
      eyebrow: 'SYNCHRONISATION FACULTATIVE', title: ['Synchronisez','à votre façon.'],
      sub: ['Un instantané sur le stockage de votre choix.','Vous décidez de la connexion et du service.'],
      custom: 'API REST personnelle', notice: 'Aucune synchro sans activation.',
      detail: 'Votre espace local fonctionne sans connexion au cloud.',
      features: ['Connectez votre propre stockage','Vous activez la synchronisation'], tag: 'LOCAL D’ABORD. CLOUD EN OPTION.'
    }
  },
  de: {
    native: 'Deutsch', font: 'Segoe UI', cjk: false, series: 'LESEZEICHENVERWALTUNG',
    groups: ['Arbeit','Design','Entwicklung','Lesestoff','Recherche','Alltag'],
    links: [
      ['Projektzentrale','Teamdateien','Sprint-Board','Teamgespräche'],
      ['Produktdesign','Designideen','Farbpaletten','Fotografie'],
      ['Meine Repositories','Web-Dokumentation','Entwicklerhandbuch','Build-Werkzeuge'],
      ['Technik','Lesestoff für heute','Ausgewählte Artikel','Frontend-Notizen'],
      ['Nachschlagewerk','Fachartikel','Sammlungen','Gedanken zum Web'],
      ['Posteingang','Meine Woche','Später ansehen','Musik zum Fokussieren']
    ],
    tabs: ['Markenideen','Pull Requests','Besprechungsnotizen','CSS Grid','Ideen fürs Büro','Neue Farbpalette','Aktuelle Meldungen'],
    overview: {
      title: ['Tabs und Lesezeichen, ','gut sortiert.'], sub: 'Dein Platz für Lesezeichen – direkt im neuen Tab.',
      features: ['Standardmäßig lokal','Ohne Konto','Oberfläche in 8 Sprachen'], tag: 'DEIN NEUER TAB, GUT SORTIERT'
    },
    drag: {
      eyebrow: 'WENIGER OFFENE TABS', title: ['Tab ziehen.','Link behalten.'],
      sub: ['Ziehe einen offenen Tab in eine Gruppe.','Beim nächsten Mal findest du ihn wieder.'],
      steps: ['Offenen Tab auswählen','In deine Gruppe ziehen','Beim nächsten Besuch wiederfinden'],
      features: ['Auf deinem Gerät gespeichert','Gruppen nach deinen Wünschen'], tag: 'JETZT GEÖFFNET. FÜR SPÄTER GESICHERT.'
    },
    themes: {
      title: ['Ein neuer Tab, ','der zu dir passt.'], sub: 'Derselbe Platz. Eine andere Stimmung.',
      labels: ['Weich / Hell','Weich / Dunkel','Glas / Hell'],
      descriptions: ['Hell und klar in den Tag starten.','Eine ruhige Umgebung zum Arbeiten.','Mattierte Karten vor deinem Hintergrund.'],
      features: ['6 visuelle Stile','Eigene Akzentfarben','Integrierte und eigene Hintergründe'], tag: 'PLATZ FÜR DEINEN STIL'
    },
    backup: {
      eyebrow: 'STANDARDMÄSSIG LOKAL', title: ['Deine Lesezeichen.','Deine Daten.'],
      sub: ['Auf deinem Gerät gespeichert.','Sichere sie, wann du möchtest.'],
      steps: ['Kein Tabvia-Konto nötig','JSON-Backup exportieren','Zusammenführen oder ersetzen'],
      features: ['Ohne Anmeldung loslegen','Lokaler Import und Export'], tag: 'KOPIE BEHALTEN. KONTROLLE BEHALTEN.'
    },
    sync: {
      eyebrow: 'OPTIONALE CLOUD-SYNCHRONISIERUNG', title: ['Deine Daten.','Deine Cloud.'],
      sub: ['Speichere einen Snapshot, wo du möchtest.','Du wählst, ob und womit du dich verbindest.'],
      custom: 'Eigene REST-API', notice: 'Erst aktivieren, dann synchronisieren.',
      detail: 'Dein lokaler Bereich funktioniert auch ohne Cloud.',
      features: ['Eigenen Speicher verbinden','Synchronisierung selbst aktivieren'], tag: 'LOKAL ZUERST. CLOUD OPTIONAL.'
    }
  }
};
