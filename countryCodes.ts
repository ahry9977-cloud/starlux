/**
 * قائمة أرقام دول العالم (مفاتيح الاتصال الدولية)
 * ملاحظة: تم حذف إسرائيل من القائمة
 */

export interface CountryCode {
  name: string;
  nameAr: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  // الدول العربية
  { name: "Iraq", nameAr: "العراق", code: "IQ", dialCode: "+964", flag: "🇮🇶" },
  { name: "Saudi Arabia", nameAr: "السعودية", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates", nameAr: "الإمارات", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Kuwait", nameAr: "الكويت", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Qatar", nameAr: "قطر", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Bahrain", nameAr: "البحرين", code: "BH", dialCode: "+973", flag: "🇧🇭" },
  { name: "Oman", nameAr: "عُمان", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Yemen", nameAr: "اليمن", code: "YE", dialCode: "+967", flag: "🇾🇪" },
  { name: "Jordan", nameAr: "الأردن", code: "JO", dialCode: "+962", flag: "🇯🇴" },
  { name: "Lebanon", nameAr: "لبنان", code: "LB", dialCode: "+961", flag: "🇱🇧" },
  { name: "Syria", nameAr: "سوريا", code: "SY", dialCode: "+963", flag: "🇸🇾" },
  { name: "Palestine", nameAr: "فلسطين", code: "PS", dialCode: "+970", flag: "🇵🇸" },
  { name: "Egypt", nameAr: "مصر", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "Libya", nameAr: "ليبيا", code: "LY", dialCode: "+218", flag: "🇱🇾" },
  { name: "Tunisia", nameAr: "تونس", code: "TN", dialCode: "+216", flag: "🇹🇳" },
  { name: "Algeria", nameAr: "الجزائر", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
  { name: "Morocco", nameAr: "المغرب", code: "MA", dialCode: "+212", flag: "🇲🇦" },
  { name: "Mauritania", nameAr: "موريتانيا", code: "MR", dialCode: "+222", flag: "🇲🇷" },
  { name: "Sudan", nameAr: "السودان", code: "SD", dialCode: "+249", flag: "🇸🇩" },
  { name: "Somalia", nameAr: "الصومال", code: "SO", dialCode: "+252", flag: "🇸🇴" },
  { name: "Djibouti", nameAr: "جيبوتي", code: "DJ", dialCode: "+253", flag: "🇩🇯" },
  { name: "Comoros", nameAr: "جزر القمر", code: "KM", dialCode: "+269", flag: "🇰🇲" },

  // أوروبا
  { name: "United Kingdom", nameAr: "المملكة المتحدة", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Germany", nameAr: "ألمانيا", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", nameAr: "فرنسا", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Italy", nameAr: "إيطاليا", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Spain", nameAr: "إسبانيا", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Portugal", nameAr: "البرتغال", code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { name: "Netherlands", nameAr: "هولندا", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Belgium", nameAr: "بلجيكا", code: "BE", dialCode: "+32", flag: "🇧🇪" },
  { name: "Switzerland", nameAr: "سويسرا", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Austria", nameAr: "النمسا", code: "AT", dialCode: "+43", flag: "🇦🇹" },
  { name: "Sweden", nameAr: "السويد", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Norway", nameAr: "النرويج", code: "NO", dialCode: "+47", flag: "🇳🇴" },
  { name: "Denmark", nameAr: "الدنمارك", code: "DK", dialCode: "+45", flag: "🇩🇰" },
  { name: "Finland", nameAr: "فنلندا", code: "FI", dialCode: "+358", flag: "🇫🇮" },
  { name: "Iceland", nameAr: "آيسلندا", code: "IS", dialCode: "+354", flag: "🇮🇸" },
  { name: "Ireland", nameAr: "أيرلندا", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { name: "Poland", nameAr: "بولندا", code: "PL", dialCode: "+48", flag: "🇵🇱" },
  { name: "Czech Republic", nameAr: "التشيك", code: "CZ", dialCode: "+420", flag: "🇨🇿" },
  { name: "Slovakia", nameAr: "سلوفاكيا", code: "SK", dialCode: "+421", flag: "🇸🇰" },
  { name: "Hungary", nameAr: "المجر", code: "HU", dialCode: "+36", flag: "🇭🇺" },
  { name: "Romania", nameAr: "رومانيا", code: "RO", dialCode: "+40", flag: "🇷🇴" },
  { name: "Bulgaria", nameAr: "بلغاريا", code: "BG", dialCode: "+359", flag: "🇧🇬" },
  { name: "Greece", nameAr: "اليونان", code: "GR", dialCode: "+30", flag: "🇬🇷" },
  { name: "Croatia", nameAr: "كرواتيا", code: "HR", dialCode: "+385", flag: "🇭🇷" },
  { name: "Slovenia", nameAr: "سلوفينيا", code: "SI", dialCode: "+386", flag: "🇸🇮" },
  { name: "Serbia", nameAr: "صربيا", code: "RS", dialCode: "+381", flag: "🇷🇸" },
  { name: "Bosnia and Herzegovina", nameAr: "البوسنة والهرسك", code: "BA", dialCode: "+387", flag: "🇧🇦" },
  { name: "Montenegro", nameAr: "الجبل الأسود", code: "ME", dialCode: "+382", flag: "🇲🇪" },
  { name: "North Macedonia", nameAr: "مقدونيا الشمالية", code: "MK", dialCode: "+389", flag: "🇲🇰" },
  { name: "Albania", nameAr: "ألبانيا", code: "AL", dialCode: "+355", flag: "🇦🇱" },
  { name: "Kosovo", nameAr: "كوسوفو", code: "XK", dialCode: "+383", flag: "🇽🇰" },
  { name: "Ukraine", nameAr: "أوكرانيا", code: "UA", dialCode: "+380", flag: "🇺🇦" },
  { name: "Belarus", nameAr: "بيلاروسيا", code: "BY", dialCode: "+375", flag: "🇧🇾" },
  { name: "Moldova", nameAr: "مولدوفا", code: "MD", dialCode: "+373", flag: "🇲🇩" },
  { name: "Lithuania", nameAr: "ليتوانيا", code: "LT", dialCode: "+370", flag: "🇱🇹" },
  { name: "Latvia", nameAr: "لاتفيا", code: "LV", dialCode: "+371", flag: "🇱🇻" },
  { name: "Estonia", nameAr: "إستونيا", code: "EE", dialCode: "+372", flag: "🇪🇪" },
  { name: "Luxembourg", nameAr: "لوكسمبورغ", code: "LU", dialCode: "+352", flag: "🇱🇺" },
  { name: "Monaco", nameAr: "موناكو", code: "MC", dialCode: "+377", flag: "🇲🇨" },
  { name: "Andorra", nameAr: "أندورا", code: "AD", dialCode: "+376", flag: "🇦🇩" },
  { name: "San Marino", nameAr: "سان مارينو", code: "SM", dialCode: "+378", flag: "🇸🇲" },
  { name: "Vatican City", nameAr: "الفاتيكان", code: "VA", dialCode: "+379", flag: "🇻🇦" },
  { name: "Liechtenstein", nameAr: "ليختنشتاين", code: "LI", dialCode: "+423", flag: "🇱🇮" },
  { name: "Malta", nameAr: "مالطا", code: "MT", dialCode: "+356", flag: "🇲🇹" },
  { name: "Cyprus", nameAr: "قبرص", code: "CY", dialCode: "+357", flag: "🇨🇾" },

  // آسيا
  { name: "Turkey", nameAr: "تركيا", code: "TR", dialCode: "+90", flag: "🇹🇷" },
  { name: "Iran", nameAr: "إيران", code: "IR", dialCode: "+98", flag: "🇮🇷" },
  { name: "Afghanistan", nameAr: "أفغانستان", code: "AF", dialCode: "+93", flag: "🇦🇫" },
  { name: "Pakistan", nameAr: "باكستان", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "India", nameAr: "الهند", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Bangladesh", nameAr: "بنغلاديش", code: "BD", dialCode: "+880", flag: "🇧🇩" },
  { name: "Sri Lanka", nameAr: "سريلانكا", code: "LK", dialCode: "+94", flag: "🇱🇰" },
  { name: "Nepal", nameAr: "نيبال", code: "NP", dialCode: "+977", flag: "🇳🇵" },
  { name: "Bhutan", nameAr: "بوتان", code: "BT", dialCode: "+975", flag: "🇧🇹" },
  { name: "Maldives", nameAr: "المالديف", code: "MV", dialCode: "+960", flag: "🇲🇻" },
  { name: "China", nameAr: "الصين", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Japan", nameAr: "اليابان", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "South Korea", nameAr: "كوريا الجنوبية", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "North Korea", nameAr: "كوريا الشمالية", code: "KP", dialCode: "+850", flag: "🇰🇵" },
  { name: "Mongolia", nameAr: "منغوليا", code: "MN", dialCode: "+976", flag: "🇲🇳" },
  { name: "Taiwan", nameAr: "تايوان", code: "TW", dialCode: "+886", flag: "🇹🇼" },
  { name: "Hong Kong", nameAr: "هونغ كونغ", code: "HK", dialCode: "+852", flag: "🇭🇰" },
  { name: "Macau", nameAr: "ماكاو", code: "MO", dialCode: "+853", flag: "🇲🇴" },
  { name: "Vietnam", nameAr: "فيتنام", code: "VN", dialCode: "+84", flag: "🇻🇳" },
  { name: "Thailand", nameAr: "تايلاند", code: "TH", dialCode: "+66", flag: "🇹🇭" },
  { name: "Malaysia", nameAr: "ماليزيا", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "Singapore", nameAr: "سنغافورة", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Indonesia", nameAr: "إندونيسيا", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "Philippines", nameAr: "الفلبين", code: "PH", dialCode: "+63", flag: "🇵🇭" },
  { name: "Brunei", nameAr: "بروناي", code: "BN", dialCode: "+673", flag: "🇧🇳" },
  { name: "Cambodia", nameAr: "كمبوديا", code: "KH", dialCode: "+855", flag: "🇰🇭" },
  { name: "Laos", nameAr: "لاوس", code: "LA", dialCode: "+856", flag: "🇱🇦" },
  { name: "Myanmar", nameAr: "ميانمار", code: "MM", dialCode: "+95", flag: "🇲🇲" },
  { name: "Timor-Leste", nameAr: "تيمور الشرقية", code: "TL", dialCode: "+670", flag: "🇹🇱" },
  { name: "Kazakhstan", nameAr: "كازاخستان", code: "KZ", dialCode: "+7", flag: "🇰🇿" },
  { name: "Uzbekistan", nameAr: "أوزبكستان", code: "UZ", dialCode: "+998", flag: "🇺🇿" },
  { name: "Turkmenistan", nameAr: "تركمانستان", code: "TM", dialCode: "+993", flag: "🇹🇲" },
  { name: "Tajikistan", nameAr: "طاجيكستان", code: "TJ", dialCode: "+992", flag: "🇹🇯" },
  { name: "Kyrgyzstan", nameAr: "قيرغيزستان", code: "KG", dialCode: "+996", flag: "🇰🇬" },
  { name: "Azerbaijan", nameAr: "أذربيجان", code: "AZ", dialCode: "+994", flag: "🇦🇿" },
  { name: "Armenia", nameAr: "أرمينيا", code: "AM", dialCode: "+374", flag: "🇦🇲" },
  { name: "Georgia", nameAr: "جورجيا", code: "GE", dialCode: "+995", flag: "🇬🇪" },

  // أمريكا الشمالية
  { name: "United States", nameAr: "الولايات المتحدة", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Canada", nameAr: "كندا", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Mexico", nameAr: "المكسيك", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "Guatemala", nameAr: "غواتيمالا", code: "GT", dialCode: "+502", flag: "🇬🇹" },
  { name: "Belize", nameAr: "بليز", code: "BZ", dialCode: "+501", flag: "🇧🇿" },
  { name: "Honduras", nameAr: "هندوراس", code: "HN", dialCode: "+504", flag: "🇭🇳" },
  { name: "El Salvador", nameAr: "السلفادور", code: "SV", dialCode: "+503", flag: "🇸🇻" },
  { name: "Nicaragua", nameAr: "نيكاراغوا", code: "NI", dialCode: "+505", flag: "🇳🇮" },
  { name: "Costa Rica", nameAr: "كوستاريكا", code: "CR", dialCode: "+506", flag: "🇨🇷" },
  { name: "Panama", nameAr: "بنما", code: "PA", dialCode: "+507", flag: "🇵🇦" },
  { name: "Cuba", nameAr: "كوبا", code: "CU", dialCode: "+53", flag: "🇨🇺" },
  { name: "Jamaica", nameAr: "جامايكا", code: "JM", dialCode: "+1876", flag: "🇯🇲" },
  { name: "Haiti", nameAr: "هايتي", code: "HT", dialCode: "+509", flag: "🇭🇹" },
  { name: "Dominican Republic", nameAr: "جمهورية الدومينيكان", code: "DO", dialCode: "+1809", flag: "🇩🇴" },
  { name: "Puerto Rico", nameAr: "بورتوريكو", code: "PR", dialCode: "+1787", flag: "🇵🇷" },
  { name: "Trinidad and Tobago", nameAr: "ترينيداد وتوباغو", code: "TT", dialCode: "+1868", flag: "🇹🇹" },
  { name: "Barbados", nameAr: "باربادوس", code: "BB", dialCode: "+1246", flag: "🇧🇧" },
  { name: "Bahamas", nameAr: "الباهاما", code: "BS", dialCode: "+1242", flag: "🇧🇸" },
  { name: "Bermuda", nameAr: "برمودا", code: "BM", dialCode: "+1441", flag: "🇧🇲" },
  { name: "Cayman Islands", nameAr: "جزر كايمان", code: "KY", dialCode: "+1345", flag: "🇰🇾" },
  { name: "Grenada", nameAr: "غرينادا", code: "GD", dialCode: "+1473", flag: "🇬🇩" },
  { name: "Saint Lucia", nameAr: "سانت لوسيا", code: "LC", dialCode: "+1758", flag: "🇱🇨" },
  { name: "Saint Vincent and the Grenadines", nameAr: "سانت فينسنت والغرينادين", code: "VC", dialCode: "+1784", flag: "🇻🇨" },
  { name: "Antigua and Barbuda", nameAr: "أنتيغوا وباربودا", code: "AG", dialCode: "+1268", flag: "🇦🇬" },
  { name: "Dominica", nameAr: "دومينيكا", code: "DM", dialCode: "+1767", flag: "🇩🇲" },
  { name: "Saint Kitts and Nevis", nameAr: "سانت كيتس ونيفيس", code: "KN", dialCode: "+1869", flag: "🇰🇳" },

  // أمريكا الجنوبية
  { name: "Brazil", nameAr: "البرازيل", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Argentina", nameAr: "الأرجنتين", code: "AR", dialCode: "+54", flag: "🇦🇷" },
  { name: "Chile", nameAr: "تشيلي", code: "CL", dialCode: "+56", flag: "🇨🇱" },
  { name: "Colombia", nameAr: "كولومبيا", code: "CO", dialCode: "+57", flag: "🇨🇴" },
  { name: "Peru", nameAr: "بيرو", code: "PE", dialCode: "+51", flag: "🇵🇪" },
  { name: "Venezuela", nameAr: "فنزويلا", code: "VE", dialCode: "+58", flag: "🇻🇪" },
  { name: "Ecuador", nameAr: "الإكوادور", code: "EC", dialCode: "+593", flag: "🇪🇨" },
  { name: "Bolivia", nameAr: "بوليفيا", code: "BO", dialCode: "+591", flag: "🇧🇴" },
  { name: "Paraguay", nameAr: "باراغواي", code: "PY", dialCode: "+595", flag: "🇵🇾" },
  { name: "Uruguay", nameAr: "أوروغواي", code: "UY", dialCode: "+598", flag: "🇺🇾" },
  { name: "Guyana", nameAr: "غيانا", code: "GY", dialCode: "+592", flag: "🇬🇾" },
  { name: "Suriname", nameAr: "سورينام", code: "SR", dialCode: "+597", flag: "🇸🇷" },
  { name: "French Guiana", nameAr: "غيانا الفرنسية", code: "GF", dialCode: "+594", flag: "🇬🇫" },

  // أفريقيا
  { name: "South Africa", nameAr: "جنوب أفريقيا", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Nigeria", nameAr: "نيجيريا", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Kenya", nameAr: "كينيا", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "Ethiopia", nameAr: "إثيوبيا", code: "ET", dialCode: "+251", flag: "🇪🇹" },
  { name: "Ghana", nameAr: "غانا", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { name: "Tanzania", nameAr: "تنزانيا", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
  { name: "Uganda", nameAr: "أوغندا", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { name: "Rwanda", nameAr: "رواندا", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { name: "Burundi", nameAr: "بوروندي", code: "BI", dialCode: "+257", flag: "🇧🇮" },
  { name: "Democratic Republic of the Congo", nameAr: "الكونغو الديمقراطية", code: "CD", dialCode: "+243", flag: "🇨🇩" },
  { name: "Republic of the Congo", nameAr: "الكونغو", code: "CG", dialCode: "+242", flag: "🇨🇬" },
  { name: "Cameroon", nameAr: "الكاميرون", code: "CM", dialCode: "+237", flag: "🇨🇲" },
  { name: "Ivory Coast", nameAr: "ساحل العاج", code: "CI", dialCode: "+225", flag: "🇨🇮" },
  { name: "Senegal", nameAr: "السنغال", code: "SN", dialCode: "+221", flag: "🇸🇳" },
  { name: "Mali", nameAr: "مالي", code: "ML", dialCode: "+223", flag: "🇲🇱" },
  { name: "Burkina Faso", nameAr: "بوركينا فاسو", code: "BF", dialCode: "+226", flag: "🇧🇫" },
  { name: "Niger", nameAr: "النيجر", code: "NE", dialCode: "+227", flag: "🇳🇪" },
  { name: "Chad", nameAr: "تشاد", code: "TD", dialCode: "+235", flag: "🇹🇩" },
  { name: "Central African Republic", nameAr: "أفريقيا الوسطى", code: "CF", dialCode: "+236", flag: "🇨🇫" },
  { name: "Gabon", nameAr: "الغابون", code: "GA", dialCode: "+241", flag: "🇬🇦" },
  { name: "Equatorial Guinea", nameAr: "غينيا الاستوائية", code: "GQ", dialCode: "+240", flag: "🇬🇶" },
  { name: "São Tomé and Príncipe", nameAr: "ساو تومي وبرينسيبي", code: "ST", dialCode: "+239", flag: "🇸🇹" },
  { name: "Angola", nameAr: "أنغولا", code: "AO", dialCode: "+244", flag: "🇦🇴" },
  { name: "Zambia", nameAr: "زامبيا", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", nameAr: "زيمبابوي", code: "ZW", dialCode: "+263", flag: "🇿🇼" },
  { name: "Mozambique", nameAr: "موزمبيق", code: "MZ", dialCode: "+258", flag: "🇲🇿" },
  { name: "Malawi", nameAr: "مالاوي", code: "MW", dialCode: "+265", flag: "🇲🇼" },
  { name: "Botswana", nameAr: "بوتسوانا", code: "BW", dialCode: "+267", flag: "🇧🇼" },
  { name: "Namibia", nameAr: "ناميبيا", code: "NA", dialCode: "+264", flag: "🇳🇦" },
  { name: "Eswatini", nameAr: "إسواتيني", code: "SZ", dialCode: "+268", flag: "🇸🇿" },
  { name: "Lesotho", nameAr: "ليسوتو", code: "LS", dialCode: "+266", flag: "🇱🇸" },
  { name: "Madagascar", nameAr: "مدغشقر", code: "MG", dialCode: "+261", flag: "🇲🇬" },
  { name: "Mauritius", nameAr: "موريشيوس", code: "MU", dialCode: "+230", flag: "🇲🇺" },
  { name: "Seychelles", nameAr: "سيشل", code: "SC", dialCode: "+248", flag: "🇸🇨" },
  { name: "Réunion", nameAr: "ريونيون", code: "RE", dialCode: "+262", flag: "🇷🇪" },
  { name: "Mayotte", nameAr: "مايوت", code: "YT", dialCode: "+262", flag: "🇾🇹" },
  { name: "Guinea", nameAr: "غينيا", code: "GN", dialCode: "+224", flag: "🇬🇳" },
  { name: "Guinea-Bissau", nameAr: "غينيا بيساو", code: "GW", dialCode: "+245", flag: "🇬🇼" },
  { name: "Sierra Leone", nameAr: "سيراليون", code: "SL", dialCode: "+232", flag: "🇸🇱" },
  { name: "Liberia", nameAr: "ليبيريا", code: "LR", dialCode: "+231", flag: "🇱🇷" },
  { name: "Gambia", nameAr: "غامبيا", code: "GM", dialCode: "+220", flag: "🇬🇲" },
  { name: "Cape Verde", nameAr: "الرأس الأخضر", code: "CV", dialCode: "+238", flag: "🇨🇻" },
  { name: "Benin", nameAr: "بنين", code: "BJ", dialCode: "+229", flag: "🇧🇯" },
  { name: "Togo", nameAr: "توغو", code: "TG", dialCode: "+228", flag: "🇹🇬" },
  { name: "Eritrea", nameAr: "إريتريا", code: "ER", dialCode: "+291", flag: "🇪🇷" },
  { name: "South Sudan", nameAr: "جنوب السودان", code: "SS", dialCode: "+211", flag: "🇸🇸" },

  // أوقيانوسيا
  { name: "Australia", nameAr: "أستراليا", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "New Zealand", nameAr: "نيوزيلندا", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "Papua New Guinea", nameAr: "بابوا غينيا الجديدة", code: "PG", dialCode: "+675", flag: "🇵🇬" },
  { name: "Fiji", nameAr: "فيجي", code: "FJ", dialCode: "+679", flag: "🇫🇯" },
  { name: "Solomon Islands", nameAr: "جزر سليمان", code: "SB", dialCode: "+677", flag: "🇸🇧" },
  { name: "Vanuatu", nameAr: "فانواتو", code: "VU", dialCode: "+678", flag: "🇻🇺" },
  { name: "Samoa", nameAr: "ساموا", code: "WS", dialCode: "+685", flag: "🇼🇸" },
  { name: "Tonga", nameAr: "تونغا", code: "TO", dialCode: "+676", flag: "🇹🇴" },
  { name: "Kiribati", nameAr: "كيريباتي", code: "KI", dialCode: "+686", flag: "🇰🇮" },
  { name: "Micronesia", nameAr: "ميكرونيزيا", code: "FM", dialCode: "+691", flag: "🇫🇲" },
  { name: "Marshall Islands", nameAr: "جزر مارشال", code: "MH", dialCode: "+692", flag: "🇲🇭" },
  { name: "Palau", nameAr: "بالاو", code: "PW", dialCode: "+680", flag: "🇵🇼" },
  { name: "Nauru", nameAr: "ناورو", code: "NR", dialCode: "+674", flag: "🇳🇷" },
  { name: "Tuvalu", nameAr: "توفالو", code: "TV", dialCode: "+688", flag: "🇹🇻" },
  { name: "New Caledonia", nameAr: "كاليدونيا الجديدة", code: "NC", dialCode: "+687", flag: "🇳🇨" },
  { name: "French Polynesia", nameAr: "بولينيزيا الفرنسية", code: "PF", dialCode: "+689", flag: "🇵🇫" },
  { name: "Guam", nameAr: "غوام", code: "GU", dialCode: "+1671", flag: "🇬🇺" },
  { name: "American Samoa", nameAr: "ساموا الأمريكية", code: "AS", dialCode: "+1684", flag: "🇦🇸" },
  { name: "Northern Mariana Islands", nameAr: "جزر ماريانا الشمالية", code: "MP", dialCode: "+1670", flag: "🇲🇵" },
  { name: "Cook Islands", nameAr: "جزر كوك", code: "CK", dialCode: "+682", flag: "🇨🇰" },
  { name: "Niue", nameAr: "نييوي", code: "NU", dialCode: "+683", flag: "🇳🇺" },
  { name: "Tokelau", nameAr: "توكيلاو", code: "TK", dialCode: "+690", flag: "🇹🇰" },
  { name: "Wallis and Futuna", nameAr: "واليس وفوتونا", code: "WF", dialCode: "+681", flag: "🇼🇫" },

  // روسيا والدول المستقلة
  { name: "Russia", nameAr: "روسيا", code: "RU", dialCode: "+7", flag: "🇷🇺" },
];

// دالة للتحقق من أن الرقم ليس من إسرائيل
export const isBlockedCountry = (dialCode: string): boolean => {
  // مفتاح إسرائيل هو +972
  const blockedCodes = ["+972", "972", "00972"];
  return blockedCodes.some(code => dialCode.startsWith(code) || dialCode === code);
};

// دالة للحصول على الدولة من مفتاح الاتصال
export const getCountryByDialCode = (dialCode: string): CountryCode | undefined => {
  return countryCodes.find(country => country.dialCode === dialCode);
};

// دالة للحصول على الدولة من رمز الدولة
export const getCountryByCode = (code: string): CountryCode | undefined => {
  return countryCodes.find(country => country.code === code);
};

// دالة للبحث في الدول
export const searchCountries = (query: string): CountryCode[] => {
  const lowerQuery = query.toLowerCase();
  return countryCodes.filter(country => 
    country.name.toLowerCase().includes(lowerQuery) ||
    country.nameAr.includes(query) ||
    country.dialCode.includes(query) ||
    country.code.toLowerCase().includes(lowerQuery)
  );
};

// الدولة الافتراضية (العراق)
export const defaultCountry = countryCodes.find(c => c.code === "IQ")!;

export default countryCodes;
