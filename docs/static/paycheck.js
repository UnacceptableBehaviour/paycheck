

import {registerGainedFocusCallback, registerLostFocusCallback} from './focus.js';
// import { v5 as uuidv5 } from './uuid/8.3.2/uuid.min.js';
// TODO use CDN for uuid.js

// function cl(args) {     // all console occur at line 8
//   console.log(args); // < - - - - - - - - - - - /
// };

// where to look in local storage for current state
const KEY_LAST_KNOWN_STATE = 'state_key';
const KEY_SW_INFO          = 'sw_info';   // must match in SW!
var   serviceWorkerVerion  = 0;

// settings & configuration
const CAMERA_MODE_GALLERY = 0;
const CAMERA_MODE_CAPTURE = 1;
const HOURLY_RATE_2024_25 = 12.04;

var settings = {
  NAMESPACE: '388e5ead-9872-4181-aef2-225b7cae61dd',  // TODO SB BLANK - calc from username
  username: '',
  password: '',
  cameraMode: CAMERA_MODE_GALLERY,
  showExceptions: true,                             // show hand authorized exception in mail breakdown 
  taxYear: '2024-25',                               // https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2024-to-2025
  TAX_RATE_2024_25: 0.20,
  TAX_2024_25_PERSONAL_ALLOWANCE: 12570,                     // for 2024 to 2025 tax year: 12571-50270 @20% 50271-125140 @40% rest @45%
  NI_RATE_LOWER_2024_25: 0.08,                      // for 2024 to 2025 tax year
  NI_RATE_UPPER_2024_25: 0.02,
  NI_2024_25_LOWER_THRESHOLD: (242 * 4) - 1,                // for 2024 to 2025 tax year 242/wk
  NI_2024_25_UPPER_THRESHOLD: (967 * 4) - 1,                // for 2024 to 2025 tax year 967/wk
  CONTRACTED_HOURS_AC: 19.5,     // SB 21
  CONTRACTED_HOURS_SB: 21,
  HOURLY_RATE_2024_25: HOURLY_RATE_2024_25,
  //HOURLY_RATE_AL_2024_25: 20.3062, //HOURLY_RATE_2024_25 * 1.5,// its more complicated than this - find out details TODO
  HOURLY_RATE_AL_2024_25: HOURLY_RATE_2024_25 * 1.5,// its more complicated than this - find out details TODO
  PENSION_EMPLOYEE_PC: 0.15,  // 0.05,
  PENSION_EMPLOYER_PC: 0.03,
  PENSION_EXEMPTION: 480
};

function generateUUID() {
  // Example unique information from the user's device and configuration
  // TODO add username & DOB request to use in uuid string
  const userAgent = navigator.userAgent;
  const language = navigator.language;

  // Combine the unique information into a single string
  const uniqueString = `${userAgent}-${language}`;

  // Generate a UUID using the unique string and namespace
  const uuid = uuidv5(uniqueString, settings.NAMESPACE);

  return uuid;
}

// Generate & Store the UUID in localStorage
const userUUID = 'bdd6d91c-f2e2-426a-baaf-3648dab3f3c0'; //generateUUID();
console.log('User UUID:', userUUID);
localStorage.setItem('userUUID', userUUID);


// +/- Days create a new Date object
Date.prototype.copyAddDays = function(days) {
  let returnDate = new Date(this);
  returnDate.setDate(returnDate.getDate() + parseInt(days));
  return returnDate;
};
// use -ve days to subtract
Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
};


//const date = payday;
//const [month, dayOfMonth, day, year] = [date.getMonth(), date.getDate(), date.getDay(), date.getFullYear()];
//const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
class Day{
  // for easy internationalisation use Intl.DateTimeFormat
  static numToDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  static numToMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  static minsToHMReadable(mins){
    return `${Math.floor(mins / 60)}H${(mins % 60).toString().padStart(2, '0')}`;
  }
  static minsToHDecimalReadable(mins){
    return `${(Math.floor(mins / 60) + ((mins % 60) / 60)).toFixed(2)}`;
  }
  
  constructor(date){
    //this.date = date;
    this.day = Day.numToDay[date.getDay()];     // Mon
    //this.HRdate = `${date.getDate()}\u00A0${Day.numToMonth[date.getMonth()]}`;  // 25&nbspAug - 25 Aug
    this.HRdate = `${date.getDate().toString().padStart(2, '0')}${Day.numToMonth[date.getMonth()]}`;  // 25Aug - better for print / email format
    this.inTime = '';         // 0728
    this.breakTime = '30';    // 30     break time in mins
    this.outTime = '';        // 1553
    this.totalMins = 0;       // integer
    this.totalALMins = 0;     // integer
    this.year = date.getFullYear();
  }
  
  initFromJSON(jsonObj){
    //console.log('initFromJSON-DAY() - - - - - - - - S');
    this.day =  jsonObj.day;
    this.HRdate = jsonObj.HRdate;
    this.inTime = jsonObj.inTime;
    this.breakTime = jsonObj.breakTime;
    this.outTime = jsonObj.outTime;
    this.totalMins = jsonObj.totalMins;
    this.totalALMins = jsonObj.totalALMins;
    if (this.totalALMins === undefined) this.totalALMins = 0;
    this.totalMinsReadableHM  = jsonObj.totalMinsReadableHM;
    this.totalMinsDecimalHM = jsonObj.totalMinsDecimalHM;
    //console.log(`initJSON-DAY(): ${this.day}-${this.HRdate}:${this.inTime}-${this.breakTime}-${this.outTime}`);
    //console.log('initFromJSON-DAY() - - - - - - - - E');
  }
  
  setHours(start, breakStr, finish){
    this.inTime = start;        // 0728
    this.breakTime = breakStr;  // 30     break time in mins / or  AL anual leave
    this.outTime = finish;      // 1553
    //console.log(`in: ${start} break: ${breakStr} out: ${finish}`);
    if (this.breakTime === 'AL') { // Anual Leave - 7hr day
      this.inTime = '0700';
      this.outTime = '1400';
      this.totalMins = 0;
      this.totalALMins = 7 * 60;
      this.totalMinsReadableHM = '7H00';
      this.totalMinsDecimalHM = '7.00';

    } else {
      if ((start === '') || (finish === '')) {
        this.totalMins = 0;
        return;
      }
  
      // finish time to mins
      let hrsF = parseInt(finish.substr(0,2));
      let minF = parseInt(finish.substr(2,4));
      let toEnd = hrsF*60 + parseInt(minF);
      //console.log(`finish: ${finish} -: ${toEnd} - hrs: ${hrsF} - mins:${minF} - hrs ${finish.slice(0,2)}`);
      
      // start time to mins inc 15m roundup
      let hrsS = parseInt(start.substr(0,2));
      let minS = parseInt(start.substr(2,4));
      
      //let roundupMins = minS + (15 - (minS % 15));                  // round up to the next nearest 15min 0701 = 0715 walmart sneakiness
      let roundupMins = minS? (minS-1) + (15 - ((minS-1) % 15)) : 0;  // round to nearest 15m  0=0, 1-15=15, 16-30=30, 31-45=45, 46-59=60
      let fromStart = hrsS*60 + roundupMins;
      
      //console.log(`start: ${start} -: ${fromStart} - hrs: ${hrsS} - mins:${minS} - rnd:${roundupMins} - hrs ${start.slice(0,2)}`);
      
      // mins to hhHmm 7H53
      // mins to decimal HRS 7.88Hrs
      let breakMins = parseInt(this.breakTime);
      let totalMins;
      if (toEnd <= (fromStart + breakMins)) {
        const ONE_DAY = 24*60;
        totalMins = (ONE_DAY - fromStart) + toEnd - breakMins;      
      } else {
        totalMins = toEnd - fromStart - breakMins;
      }
      
      this.totalMins = totalMins;
      this.totalMinsReadableHM = `${Math.floor(this.totalMins / 60)}H${(this.totalMins % 60).toString().padStart(2, '0')}`;
      this.totalMinsDecimalHM = `${(Math.floor(this.totalMins / 60) + ((this.totalMins % 60) / 60)).toFixed(2)}`;      
    }  
  }
  
  clearHours(){
    this.inTime = '';
    this.breakTime = '30';
    this.outTime = '';
    this.totalMins = 0;
    this.totalALMins = 0;
    this.totalMinsReadableHM = '';
    this.totalMinsDecimalHM = '';
  }
  
}

// COLUMN WIDTHS for emailVersionSummary
const PAD_DAY  = 4;
const PAD_DATE = 8;
const PAD_IN   = 6;
const PAD_BRK  = 5;
const PAD_OUT  = 8;
const PAD_HRS  = 6;
const PAD_DHRS = 5;
const PAD_TITLE_PAYDAY = PAD_DAY + PAD_DATE;
const PAD_TITLE_WK_RANGE = PAD_IN + PAD_BRK;
const PAD_TITLE_DATE_RANGE = PAD_OUT + PAD_HRS +PAD_DHRS;
const PAD_TOT_INDENT = PAD_DAY + PAD_DATE + PAD_IN + PAD_BRK;
const PAD_TOT = PAD_OUT;
const PAD_TOT_HRS = PAD_HRS;
const PAD_TOT_DHRS = PAD_DHRS;
const PAD_WK_TOTS = 10;
const PAD_TOTS_DEDS_TITLE = 30;
const PAD_TOTS_DEDS_VAL = 10;
const FORMAT_EMAIL  = 0;
const FORMAT_TXT    = 1;
const FORMAT_HTML   = 2;

class PayCycle4wk {
  static OFFSET_CUTOFF = -6;
  static OFFSET_START = -33;
  static DAYS_IN_CYCLE = 28;
  static prefixes = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  static postfixes = ['_date_js','_in','_break','_out','_hrs','_dhrs','',''];

  static nextPayDayAfterToday(thisDate = new Date()) {
    let refDate = new Date("2022-08-12T04:00:00");
    let refWeekNo = 28;
    let thisDayMsSinceEpoch = thisDate.getTime();

    for (let i = 0; i < 200; i += 1) {
      // 13 steps = 1 year (52 / 4week cycle)
      if (thisDayMsSinceEpoch < refDate.getTime()) return [refDate, refWeekNo];
      refDate.addDays(28);
      refWeekNo += 4;
      if (refWeekNo > 52) refWeekNo = refWeekNo - 52;
      //console.log(`nextPD: ${refWeekNo} - ${refDate.toISOString()} - ${refDate.getTime()} - ${refMsSinceEpoch}`);
    }

    // catch
    refDate = new Date("2022-08-12T04:00:00");
    refWeekNo = 28;
    return [refDate, refWeekNo];
  }

  static highLightTodaysEntry(element = undefined) {
    if (element) {
      document.querySelector("#date-today").classList.add("day-highlight");
      element.classList.add("day-highlight");
      setTimeout(() => {
        document.querySelector("#date-today").classList.remove("day-highlight");
      }, 10);
      setTimeout(() => {
        element.classList.remove("day-highlight");
      }, 10);
    }
  }

  constructor(payDay, startWkNo) {
    // let pc = new PayCycle4wk(new Date(2022, 07, 12)); // the month is 0-indexed
    this.userUUID = userUUID;
    this.payDay = payDay;
    this.cutOff = payDay.copyAddDays(PayCycle4wk.OFFSET_CUTOFF);
    this.payStart = payDay.copyAddDays(PayCycle4wk.OFFSET_START);
    this.weekNo = 0; // 0-3
    this.weekNos = [
      startWkNo,
      (startWkNo + 1) % 52,
      (startWkNo + 2) % 52,
      (startWkNo + 3) % 52,
    ];
    this.weekTotalMins = [0, 0, 0, 0];
    this.weekTotalALMins = [0, 0, 0, 0];
    this.cycleTotalMins = 0;
    this.cycleTotalALMins = 0;

    // localstorage key format: 2022_HRS_28-31_12AUG < WAS TODO REMOVE
    //                 payday > YYYY MMDD 
    // localstorage key format: 2022_0812_WKS_28-31  < IS
    this.localStorageKey = `${this.payDay.getFullYear()}_${(this.payDay.getMonth()+1).toString().padStart(2, '0')}${this.payDay.getDate().toString().padStart(2, '0')}_WKS_${(this.weekNos[0]).toString().padStart(2, '0')}-${(this.weekNos[3]).toString().padStart(2, '0')}`.toUpperCase();  console.log(`this.localStorageKey: ${this.localStorageKey} <<`);
    this.daysInCycle = [];

    var date = this.payStart;
    for (let dayNo = 0; dayNo < PayCycle4wk.DAYS_IN_CYCLE; dayNo += 1) {
      this.daysInCycle.push(new Day(date));
      date = date.copyAddDays(1);
    }

    this.gross4wk = 0;
    this.annualIncomeEstimate = 0;
    this.pensionEmployer = 0;
    this.pensionEmployee = 0;
    this.taxableIncome = 0; // after pension deduction
    this.contribNI = 0;
    this.incomeTax = 0;
    this.deductions = 0;
    this.netIncomeForCycle = 0;
  }

  initFromJSON(jsonObj){ // let dt = new Date("2022-08-06T03:00:00.000Z")
    //console.log('initFromJSON() - - - - - - - - S');
    this.payDay           = new Date(jsonObj.payDay);   //console.log(jsonObj.payDay']);  
    this.cutOff           = new Date(jsonObj.cutOff);   //console.log(jsonObj.cutOff']);
    this.payStart         = new Date(jsonObj.payStart); //console.log(jsonObj.payStart']);
    this.weekNo           = jsonObj.weekNo;             //console.log(jsonObj.weekNo']);
    this.weekNos          = jsonObj.weekNos;            //console.log(jsonObj.weekNos']);
    this.localStorageKey  = jsonObj.localStorageKey;    //console.log(jsonObj.localStorageKey']);    
    for (let dayNo = 0; dayNo < PayCycle4wk.DAYS_IN_CYCLE; dayNo +=1) {
      this.daysInCycle[dayNo].initFromJSON(jsonObj.daysInCycle[dayNo]);
    }
    //console.log(`initFromJSON-4WK(): ${this.payDay}-${this.localStorageKey}:${this.weekNos}`);
    //console.log('initFromJSON() - - - - - - - - E');
  }

  clearHours(dayNo) {
    if (dayNo >= 0 && dayNo < PayCycle4wk.DAYS_IN_CYCLE) {
      this.daysInCycle[dayNo].clearHours();
    } else {
      // TODO raise
      //console.log(`clearHours FAILED - dayNo:${dayNo} - OUT OF RANGE Should be 0-${PayCycle4wk.DAYS_IN_CYCLE}`);
    }
  }

  weekBak() {
    if (this.weekNo > 0) this.weekNo -= 1;
  }

  weekFwd() {
    if (this.weekNo < 3) this.weekNo += 1;
  }

  getWeekNo(no=-1){
    let wkNoIndex = no;
    if      (no < 0) { wkNoIndex = this.weekNo; }
    else if (no > 3) { wkNoIndex = this.weekNo; }

    return this.weekNos[wkNoIndex];
  }

  getWeekNoDateRange() {
    let start = this.daysInCycle[this.weekNo * 7]; // console.log(start);
    let end = this.daysInCycle[this.weekNo * 7 + 6]; // console.log(end);
    return `${this.weekNo+1} / ${this.weekNos[this.weekNo]} ~  ${start.HRdate} - ${end.HRdate}`;
  }

  getNextPayDay() {
    var returnDate = this.payDay.copyAddDays(PayCycle4wk.DAYS_IN_CYCLE);
    var weekNo = this.weekNos[0] + 4;
    if (weekNo > 52) weekNo = weekNo - 52;
    return [returnDate, weekNo];
  }

  getLastPayDay() {
    var returnDate = this.payDay.copyAddDays(PayCycle4wk.DAYS_IN_CYCLE * -1);
    var weekNo = this.weekNos[0] - 4;
    if (weekNo < 1) weekNo = weekNo + 52;
    return [returnDate, weekNo];
  }

  updateWeekTotalMins() {
    let dayOfMonth = 0;
    for (let wkNo = 0; wkNo < 4; wkNo += 1) {
      let weekTotal = 0;
      let weekALTotal = 0;
      for (let dayNo = 0; dayNo < 7; dayNo += 1) {
        dayOfMonth = 7 * wkNo + dayNo;
        weekTotal += this.daysInCycle[dayOfMonth].totalMins;
        weekALTotal += this.daysInCycle[dayOfMonth].totalALMins;
      }
      this.weekTotalMins[wkNo] = weekTotal;
      this.weekTotalALMins[wkNo] = weekALTotal;
    }
    this.cycleTotalMins = 0;
    this.cycleTotalALMins = 0;
    for (let wkNo = 0; wkNo < 4; wkNo += 1) {
      this.cycleTotalMins += this.weekTotalMins[wkNo];
      this.cycleTotalALMins += this.weekTotalALMins[wkNo];
    }
  }

  // Function to calculate gross earnings
  calculateGrossEarnings(hourlyRate, hoursWorked) {
    return hourlyRate * hoursWorked;
  }

  // Function to calculate pension contributions
  calculatePension(grossEarnings) {
    const earningsSubjectToPension =
      grossEarnings > settings.PENSION_EXEMPTION
        ? grossEarnings - settings.PENSION_EXEMPTION
        : 0;

    const employeeContribution = earningsSubjectToPension * settings.PENSION_EMPLOYEE_PC;
    const employerContribution = earningsSubjectToPension * settings.PENSION_EMPLOYER_PC;

    this.pensionEmployee = employeeContribution;
    this.pensionEmployer = employerContribution;

    return { employeeContribution, employerContribution };
  }

  // Function to calculate taxable income
  calculateTaxableIncome(grossEarnings, employeePension) {
    this.taxableIncome = grossEarnings - employeePension;
    return this.taxableIncome;
  }

  // Function to calculate National Insurance (NI)
  calculateNI(grossEarnings) {
    if (grossEarnings <= settings.NI_2024_25_LOWER_THRESHOLD) {
      this.contribNI = 0;
    } else if (grossEarnings <= settings.NI_2024_25_UPPER_THRESHOLD) {
      this.contribNI =
        (grossEarnings - settings.NI_2024_25_LOWER_THRESHOLD) *
        settings.NI_RATE_LOWER_2024_25;
    } else {
      this.contribNI =
        (settings.NI_2024_25_UPPER_THRESHOLD -
          settings.NI_2024_25_LOWER_THRESHOLD) *
          NI_RATE_LOWER_2024_25 +
        (grossEarnings - NI_2024_25_UPPER_THRESHOLD) * NI_RATE_UPPER_2024_25;
    }
    return this.contribNI;
  }

  // Function to calculate income tax - upper tax bracket not implemented
  // delivery driver on 12.04 would have to work 80hrs a week for 52 weeks to reach £50086
  // thouroughly illegal and £190 short of the next bracket!
  // taxable income is gross income -  employee pension
  calculateIncomeTax(taxableIncome) {
    const annualIncome = taxableIncome * 13;
    const taxableAmount =
      annualIncome > settings.TAX_2024_25_PERSONAL_ALLOWANCE
        ? annualIncome - settings.TAX_2024_25_PERSONAL_ALLOWANCE
        : 0;
    const annualTax = taxableAmount * settings.TAX_RATE_2024_25;
    this.incomeTax = annualTax / 13;
    return this.incomeTax;
  }

  // Function to calculate take-home pay
  calculateTakeHomePay(grossEarnings, employeePension, ni, incomeTax) {
    return grossEarnings - employeePension - ni - incomeTax;
  }

  finalCalculations(hrs = 0, holHrs = 0) {
    // anual /4 * 52
    let hoursForCycle = parseFloat(Day.minsToHDecimalReadable(this.cycleTotalMins) );
    let hoursALForCycle = parseFloat(Day.minsToHDecimalReadable(this.cycleTotalALMins));

    if (hrs != 0 || holHrs != 0) {
      hoursForCycle = hrs;
      hoursALForCycle = holHrs;
    }

    this.gross4wk =
      hoursForCycle * settings.HOURLY_RATE_2024_25 +
      hoursALForCycle * settings.HOURLY_RATE_AL_2024_25;

    this.annualIncomeEstimate = (this.gross4wk / 4) * 52;

    this.calculatePension(this.gross4wk);

    this.calculateNI(this.gross4wk);

    this.calculateTaxableIncome(this.gross4wk, this.pensionEmployee);

    this.calculateIncomeTax(this.taxableIncome);

    this.deductions = this.incomeTax + this.contribNI + this.pensionEmployee;

    this.netIncomeForCycle = this.gross4wk - this.deductions;
  }

  // TODO - add a save to server option
  // storage - https://neon.tech/?ref=devsidebar-c2&bb=177097
  //
  persistentSave() {
    const jsonData = JSON.stringify(this);
    localStorage.setItem(this.localStorageKey, jsonData);

  }

  saveToServer() {
    this.command = "SAVE";
    const jsonData = JSON.stringify(this);
    
    //return fetch("http://127.0.0.1:50030/save", {
    return fetch("https://paycheckcloud.creativemateriel.synology.me/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonData,
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Successfully saved to server:", data);
    })
  }

  retrieveFromServer() {
    this.command = "RETRIEVE";
    const jsonData = {command: this.command,
                      userUUID: this.userUUID,
                      localStorageKey: this.localStorageKey};

    //return fetch("http://127.0.0.1:50030/save", {
      return fetch("https://paycheckcloud.creativemateriel.synology.me/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Successfully retrieved from server:", data);
      // TODO add dialogue 'Overwrite current data?'  YES/NO?
      // TODO add dta integrity / validation checks before overwriting
      this.initFromJSON(data);          // 
      this.updateHTML();                // - - some of the calculaated data not stored needs to be recalculated & updated
      this.updateModelFromForms();      //        \ - - check this TODO
      // TODO update Estimates & Deductions
      this.finalCalculations();
      this.updateHTML();
      // TODO REDO ALL CALCS DIRECTLY FROM HOURS
      // An extra days anual leave appeared !??
    });
  }

  // call on submit & week change
  updateModelFromForms() {
    // cycle through days parse content into relevant object
    //console.log('> - - - processing form data');
    let startDay = this.weekNo * 7;
    for (let dayNo = startDay; dayNo < startDay + 7; dayNo += 1) {
      let start = document
        .querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_in`)
        .textContent.trim();

      // drop down input: value/placeholder
      let value = document
        .querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_break`)
        .value.trim();
      let placeholder = document
        .querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_break`)
        .placeholder.trim();
      let breakStr = value ? value : placeholder;

      let finish = document
        .querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_out`)
        .textContent.trim();
      //console.log(`==: ${startDay} - ${dayNo} - ${this.daysInCycle[dayNo].HRdate} :== S`);
      this.daysInCycle[dayNo].setHours(start, breakStr, finish);
      //console.log(`==: ${this.daysInCycle[dayNo].HRdate} :== E`);
    }
    // pension input id='pension_pc'
    settings.PENSION_EMPLOYEE_PC = document.querySelector("#pension_pc").value / 100;
    this.updateWeekTotalMins();
    this.finalCalculations();
  }

  updateHTML(){
    // TODAYS DATE
    let todayClockElement;
    let today = new Day(new Date());
    document.querySelector('#date-today-day').textContent = today.day;
    document.querySelector('#date-today-date').textContent = today.HRdate;
    document.querySelector('#date-today-year').textContent = today.year;
    
    // HEADER - update pay_day, cut_off, wk_range = week no's, wk_range_dates 4week date range
    document.querySelector('#pay_day_js').textContent = `Pay Day: ${this.payDay.getDate()} ${Day.numToMonth[this.payDay.getMonth()]} ${this.payDay.getFullYear().toString().slice(-2)}`;
    document.querySelector('#wk_range_js').textContent = ` ${this.getWeekNo(0)} - ${this.getWeekNo(3)}`;
    document.querySelector('#wk_range_dates_js').textContent = `${this.payStart.getDate()} ${Day.numToMonth[this.payStart.getMonth()]} - ${this.cutOff.getDate()} ${Day.numToMonth[this.cutOff.getMonth()]}`;
    document.querySelector('#wk_no_js').textContent = this.getWeekNoDateRange();
    document.querySelector("#pension_pc").value = settings.PENSION_EMPLOYEE_PC * 100;


    // HOURS TABLE
    let startDay = this.weekNo * 7;
    let tableRowElements = document.querySelectorAll('.hrs-row');
    for (let dayNo = startDay; dayNo < startDay+7; dayNo +=1) {
      //console.log(`${startDay} - ${dayNo} - ${this.daysInCycle[dayNo].day} - ${this.daysInCycle[dayNo].HRdate}`);
      tableRowElements[dayNo % 7].id = `${dayNo}`; // make date easy to fine when roww dblClicked
      document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_date_js`).textContent = this.daysInCycle[dayNo].HRdate;
      document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_in`).textContent = this.daysInCycle[dayNo].inTime;
      document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_break`).placeholder = this.daysInCycle[dayNo].breakTime;
      document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_break`).value = null;
      document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_out`).textContent = this.daysInCycle[dayNo].outTime;
      document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_hrs`).textContent = this.daysInCycle[dayNo].totalMinsReadableHM;
      document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_dhrs`).textContent = this.daysInCycle[dayNo].totalMinsDecimalHM;
      
      // detect highLightTodaysEntry element
      if (today.HRdate === this.daysInCycle[dayNo].HRdate) {
        if (this.daysInCycle[dayNo].inTime === '') {
          todayClockElement = document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_in`).parentElement;
        } else if (this.daysInCycle[dayNo].outTime === '') {
          todayClockElement = document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_out`).parentElement;
        }
      }
    }
    
    // WEEKLY TOTALS
    for (let weekNo = 0; weekNo<4; weekNo +=1) {
      //console.log(`wkNo:${weekNo} - hrs:${Day.minsToHMReadable(this.weekTotalMins[weekNo])} - Dhrs:${Day.minsToHDecimalReadable(this.weekTotalMins[weekNo])}`);
      document.querySelector(`#r${weekNo+1}_wk_no`).textContent = `${weekNo+1} / ${this.weekNos[weekNo]}`;
      document.querySelector(`#r${weekNo+1}_tot_hrs`).textContent = Day.minsToHMReadable(this.weekTotalMins[weekNo]);
      document.querySelector(`#r${weekNo+1}_tot_dhrs`).textContent =  Day.minsToHDecimalReadable(this.weekTotalMins[weekNo]);
      // AL hours if present
      let anualLeavMins = this.weekTotalALMins[weekNo];
      if (anualLeavMins) {
        document.getElementById(`al_wkr${weekNo+1}`).classList.remove('wk-row-hide');
        document.querySelector(`#r${weekNo+1}h_wk_no`).textContent = `${weekNo+1} / AL`;
        document.querySelector(`#r${weekNo+1}h_tot_hrs`).textContent = Day.minsToHMReadable(anualLeavMins);
        document.querySelector(`#r${weekNo+1}h_tot_dhrs`).textContent =  Day.minsToHDecimalReadable(anualLeavMins);
      } else {
        document.getElementById(`al_wkr${weekNo+1}`).classList.add('wk-row-hide');
      }
    }    

    // HRS SUB-TOTAL
    document.querySelector(`#r5_subtot_hrs`).textContent = Day.minsToHMReadable(this.cycleTotalMins);
    document.querySelector(`#r5_subtot_dhrs`).textContent =  Day.minsToHDecimalReadable(this.cycleTotalMins);

    // AL HRS SUB-TOTAL
    document.querySelector(`#r5_subtot_al_hrs`).textContent = Day.minsToHMReadable(this.cycleTotalALMins);
    document.querySelector(`#r5_subtot_al_dhrs`).textContent =  Day.minsToHDecimalReadable(this.cycleTotalALMins);

    // MONTHLY TOTAL
    document.querySelector(`#r6_tot_hrs`).textContent = Day.minsToHMReadable(this.cycleTotalMins + this.cycleTotalALMins);
    document.querySelector(`#r6_tot_dhrs`).textContent =  Day.minsToHDecimalReadable(this.cycleTotalMins + this.cycleTotalALMins);

    // TOTALS
    document.querySelector("#r1_anual_in").textContent =
      this.annualIncomeEstimate.toFixed(2);
    document.querySelector("#r2_gross_4wk").textContent =
      this.gross4wk.toFixed(2);
    document.querySelector("#r3_pension_employer").textContent =
      this.pensionEmployer.toFixed(2);
    document.querySelector("#r4_pension_employee").textContent =
      this.pensionEmployee.toFixed(2);
    document.querySelector("#r5_ni").textContent = this.contribNI.toFixed(2);
    document.querySelector("#r6_tax").textContent = this.incomeTax.toFixed(2);
    document.querySelector("#r7_tot_dedcts").textContent =
      this.deductions.toFixed(2);
    document.querySelector("#r8_net").textContent =
      this.netIncomeForCycle.toFixed(2);

    PayCycle4wk.highLightTodaysEntry(todayClockElement);
  }

  static createLine(t0,p0,t1,p1,t2,p2,t3,p3,t4,p4,t5,p5,t6,p6,t7,p7,t8,p8){
    t0 = (t0) ? t0 : '';    p0 = (p0) ? p0 : 0;
    t1 = (t1) ? t1 : '';    p1 = (p1) ? p1 : 0;
    t2 = (t2) ? t2 : '';    p2 = (p2) ? p2 : 0;
    t3 = (t3) ? t3 : '';    p3 = (p3) ? p3 : 0;
    t4 = (t4) ? t4 : '';    p4 = (p4) ? p4 : 0;
    t5 = (t5) ? t5 : '';    p5 = (p5) ? p5 : 0;
    t6 = (t6) ? t6 : '';    p6 = (p6) ? p6 : 0;
    t7 = (t7) ? t7 : '';    p7 = (p7) ? p7 : 0;
    t8 = (t8) ? t8 : '';    p8 = (p8) ? p8 : 0;
    return (
      t0.padEnd(p0) +
      t1.padEnd(p1) +
      t2.padEnd(p2) +
      t3.padEnd(p3) +
      t4.padEnd(p4) +
      t5.padEnd(p5) +
      t6.padEnd(p6) +
      t7.padEnd(p7) +
      "\n"
    );
  }

  reportDayLine(day, date, start, brk, finish, hrs, dhrs){
    return (
      PayCycle4wk.createLine(day,     PAD_DAY,        // 0
                             date,    PAD_DATE,
                             start,   PAD_IN,
                             brk,     PAD_BRK,
                             finish,  PAD_OUT,        // 4
                             hrs,     PAD_HRS,
                             dhrs,    PAD_DHRS,
                             '',      0,
                             '',      0 ) );          // 8 
  }

  reportTitleLine(payday, wkRange, dateRange){
    return (
      PayCycle4wk.createLine(payday,      PAD_TITLE_PAYDAY,        // 0
                             wkRange,     PAD_TITLE_WK_RANGE,
                             dateRange,   PAD_TITLE_DATE_RANGE) );
  }

  reportColumnHeaders(){
    return (
      PayCycle4wk.createLine('DATE',     PAD_DAY + PAD_DATE,
                             'IN',       PAD_IN,
                             'BRK?',     PAD_BRK,
                             'OUT',      PAD_OUT, 
                             'HRS',      PAD_HRS,
                             'DHRS',     PAD_DHRS ) );
  }

  reportWeek(title, startDay){
    let weekDays = this.reportColumnHeaders();
    
    for (let dayNo = startDay; dayNo < startDay+7; dayNo +=1) {      
      let line = this.reportDayLine(Day.numToDay[dayNo %7],
                                this.daysInCycle[dayNo].HRdate,
                                this.daysInCycle[dayNo].inTime,
                                this.daysInCycle[dayNo].breakTime,
                                this.daysInCycle[dayNo].outTime,
                                this.daysInCycle[dayNo].totalMinsReadableHM,
                                this.daysInCycle[dayNo].totalMinsDecimalHM);
      if ( settings.showExceptions && (parseInt(this.daysInCycle[dayNo].breakTime) === 0)) {
        line = line.replace('\n'," EXCEPTION\n");
      }
      weekDays += line;
    }
    
    return `${title}\n${weekDays}`;
  }

  emailVersionSummary(emailFormat=FORMAT_EMAIL){ // feels like a rehash of updateHTML - maybe a smarter way to do both?
    // mailto scheme: https://www.rfc-editor.org/rfc/rfc2368#page-3
    // more:          https://www.rfc-editor.org/rfc/rfc1738#page-12
    // use '%0D%0A' in place of '\n'
        
    // cycle summary details
    let textSummary = this.reportTitleLine(`PayDay: ${this.payDay.getDate()}${Day.numToMonth[this.payDay.getMonth()]}  `, `WKS ${this.weekNos[0]}-${this.weekNos[3]}`, `${this.daysInCycle[0].HRdate}-${this.daysInCycle[27].HRdate}`);
    textSummary += '\n';
    
    // column titles    
    for (let weekNo = 0; weekNo<4; weekNo +=1) {
      let startDay = weekNo * 7;
      let titleString = `> WK-${this.weekNos[weekNo]} ${this.daysInCycle[startDay].HRdate} - ${this.daysInCycle[startDay+6].HRdate}`;
      
      textSummary += this.reportWeek(titleString, startDay);

      // add totals
      textSummary += PayCycle4wk.createLine('',PAD_TOT_INDENT,
                                'TOTAL:',PAD_TOT,
                                Day.minsToHMReadable(this.weekTotalMins[weekNo] + this.weekTotalALMins[weekNo]), PAD_TOT_HRS,
                                Day.minsToHDecimalReadable(this.weekTotalMins[weekNo] + this.weekTotalALMins[weekNo]), PAD_TOT_DHRS);
      textSummary += '\n';
    }

    // Add week summaries
    textSummary += PayCycle4wk.createLine('WK',PAD_WK_TOTS,
                                          'HRS',PAD_WK_TOTS,
                                          'DHRS',PAD_WK_TOTS);    

    for (let weekNo = 0; weekNo<4; weekNo +=1) {
      textSummary += PayCycle4wk.createLine(`WK ${weekNo+1}/${this.weekNos[weekNo]}`,PAD_WK_TOTS,
                                            Day.minsToHMReadable(this.weekTotalMins[weekNo]),PAD_WK_TOTS,
                                            Day.minsToHDecimalReadable(this.weekTotalMins[weekNo]),PAD_WK_TOTS);
      
      let anualLeavMins = this.weekTotalALMins[weekNo];
      if (anualLeavMins) {
        textSummary += PayCycle4wk.createLine(`WK ${weekNo+1}/AL`,PAD_WK_TOTS,
                                            Day.minsToHMReadable(anualLeavMins),PAD_WK_TOTS,
                                            Day.minsToHDecimalReadable(anualLeavMins),PAD_WK_TOTS);
      }
    }

    textSummary += PayCycle4wk.createLine('TOTAL:',PAD_WK_TOTS,
                                          Day.minsToHMReadable(this.cycleTotalMins + this.cycleTotalALMins),PAD_WK_TOTS,
                                          Day.minsToHDecimalReadable(this.cycleTotalMins + this.cycleTotalALMins),PAD_WK_TOTS);
    textSummary += '\n';

    // Add totals
    textSummary += document.querySelector('#r0_final_tots_title').textContent+'\n';
    textSummary += document.querySelector('#r1_anual_in_t').textContent.padEnd(PAD_TOTS_DEDS_TITLE)    +this.annualIncomeEstimate.toFixed(2).padStart(PAD_TOTS_DEDS_VAL)+'\n';
    textSummary += document.querySelector('#r2_gross_4wk_t').textContent.padEnd(PAD_TOTS_DEDS_TITLE)   +this.gross4wk.toFixed(2).padStart(PAD_TOTS_DEDS_VAL)+'\n';
    textSummary += document.querySelector('#r3_pension_t').textContent.padEnd(PAD_TOTS_DEDS_TITLE)     +this.pensionContrib.toFixed(2).padStart(PAD_TOTS_DEDS_VAL)+'\n';
    textSummary += document.querySelector('#r4_ni_t').textContent.padEnd(PAD_TOTS_DEDS_TITLE)          +this.contribNI.toFixed(2).padStart(PAD_TOTS_DEDS_VAL)+'\n';
    textSummary += document.querySelector('#r5_tax_t').textContent.padEnd(PAD_TOTS_DEDS_TITLE)         +this.incomeTax.toFixed(2).padStart(PAD_TOTS_DEDS_VAL)+'\n';
    textSummary += document.querySelector('#r6_tot_dedcts_t').textContent.padEnd(PAD_TOTS_DEDS_TITLE)  +this.deductions.toFixed(2).padStart(PAD_TOTS_DEDS_VAL)+'\n';
    textSummary += document.querySelector('#r7_net_t').textContent.padEnd(PAD_TOTS_DEDS_TITLE)         +this.netIncomeForCycle.toFixed(2).padStart(PAD_TOTS_DEDS_VAL)+'\n';
    
    textSummary += '\n\n';
    textSummary += `Sent on ${new Date()} by payCheck - MIT Lisence \nhttps://unacceptablebehaviour.github.io/paycheck/ \n\n`;
    
    console.log(textSummary);

    switch(emailFormat) {
      case FORMAT_EMAIL:
        return textSummary.replaceAll("\n", '%0D%0A'); // use '%0D%0A' in place of '\n' for correct display in eMail
      case FORMAT_HTML:
        return textSummary.replaceAll("\n", '<br>');
      default:
        return textSummary;
    }
  }
}



// - - - - - - - - - - - - - - - - - - - - - - - - APP START- - - - - - - - - - - - - - - = = = <


var pc = new PayCycle4wk(...PayCycle4wk.nextPayDayAfterToday());
var stateKey = '';
//console.log(pc);

if (KEY_LAST_KNOWN_STATE in localStorage) {  // retrieve current statekey, and 4wk cycle object
  stateKey = localStorage.getItem(KEY_LAST_KNOWN_STATE);
  if ((stateKey !== "undefined") && (stateKey) && (stateKey in localStorage)) {
    let jsonObj = JSON.parse(localStorage.getItem(stateKey));
    pc.initFromJSON(jsonObj);
    console.log(`LOADED PayCycle4wk object key: ${stateKey} < from localStrorage\n- KEYS Match: ${stateKey === pc.localStorageKey}`);  
  }
} else {
  // save a new state key
  localStorage.setItem(KEY_LAST_KNOWN_STATE, pc.localStorageKey);
}

function addDebugLine(text) {
  return `<br>${text}`;
}

function debugInfo(args) {
  let debugText = "* * * DEBUG INFO (beta release) * * * ";
  
  if (KEY_SW_INFO in localStorage) {
    if (serviceWorkerVerion === 0) serviceWorkerVerion = localStorage.getItem(KEY_SW_INFO);
    console.log(`FOUND SW Version ${serviceWorkerVerion}`);
  }  
  
  debugText += addDebugLine('');
  debugText += addDebugLine(`paycheck.js V00.07 / SW ${serviceWorkerVerion}`); // verion_number_passed_in
  debugText += addDebugLine('');
  
  // based on
  debugText += addDebugLine(`Based on year: ${settings.taxYear}`);
  debugText += addDebugLine('UK-ENGLAND');
  debugText += addDebugLine('-');
  debugText += addDebugLine('AL: Annual Leave');
  debugText += addDebugLine('-');
  debugText += addDebugLine(`TAX_RATE_2024_25: ${(settings.TAX_RATE_2024_25 * 100).toFixed(2)}%`);
  debugText += addDebugLine(`TAX_2024_25_ALLOWANCE: £${settings.TAX_2024_25_PERSONAL_ALLOWANCE}`);
  debugText += addDebugLine(`NI_RATE_LOWER_2024_25: ${(settings.NI_RATE_LOWER_2024_25 * 100).toFixed(2)}%`);
  debugText += addDebugLine(`NI_2024_25_LOWER_THRESHOLD: £${settings.NI_2024_25_LOWER_THRESHOLD}`);
  debugText += addDebugLine(`HOURLY_RATE_2024_25: £${(settings.HOURLY_RATE_2024_25).toFixed(2)}`);
  debugText += addDebugLine(`HOURLY_RATE_2024_25_AL: £${settings.HOURLY_RATE_AL_2024_25}`);
  debugText += addDebugLine(`PENSION_EMPLOYEE_PC: ${(settings.PENSION_EMPLOYEE_PC * 100).toFixed(2)}%`);
  debugText += addDebugLine(`PENSION_EMPLOYER_PC: ${(settings.PENSION_EMPLOYER_PC * 100).toFixed(2)}%`);
  debugText += addDebugLine('-');
  debugText += addDebugLine(userUUID);
  debugText += addDebugLine('//');

  if (serviceWorkerVerion === 0) {
    debugText += addDebugLine('** WARNING **');
    debugText += addDebugLine(`SW version info NOT FOUND - KEY: ${KEY_SW_INFO} < NOT FOUND.`);
  }
  
  return debugText;
}

function displayFlash(event, id, classSpecific, classShow, innerHTML='') {
  console.log(`> = = = POP FLASH ${id} = = = <`);
  let targetBtn = event.target;
  let debugDiv = document.createElement('div');
  debugDiv.id = id;
  debugDiv.classList.add("flash", ...classSpecific); // add remove toggle
  //debugDiv.innerHTML = debugInfo();
  debugDiv.innerHTML = innerHTML;
  document.body.appendChild(debugDiv);
  targetBtn.classList.add('btn-disable');
  
  setTimeout(()=>{debugDiv.classList.add(classShow); console.log('-SHOW-');}, 5);  
  
  document.getElementById(id).addEventListener('click', function(event){
    console.log(`> = = = HIDE FLASH ${id} = = = <`);
    debugDiv.addEventListener('transitionend', (event)=>{ // NOT animationend
      debugDiv.remove();
      targetBtn.classList.remove('btn-disable');
      //console.log('-transitionEnd-');
    });    
    debugDiv.classList.remove(classShow);  // NOT animate! TRANSITION!
  });  
}

window.addEventListener('load',function(){
  console.log('LOADED - adding event listeners');

  // Load settings from localStorage if they're present
  if ('user_settings' in localStorage) {
    settings = JSON.parse(localStorage.getItem('user_settings'));
  }

  pc.updateWeekTotalMins();
  pc.finalCalculations();  
  pc.updateHTML();
  console.log(pc);
  
  // FORWARD & BACK BUTTONS WEEK & MONTH
  // << WEEK
  document.querySelector('#but_wk_no_bak').addEventListener('click', function(event){
    pc.updateModelFromForms();    
    pc.weekBak();
    pc.updateHTML();
    pc.persistentSave();    
    //console.log(`Week BACK - WkNo: ${pc.getWeekNo()}`);      
  });
  
  // WEEK >>
  document.querySelector('#but_wk_no_fwd').addEventListener('click', function(event){
    pc.updateModelFromForms();
    pc.weekFwd();    
    pc.updateHTML();
    pc.persistentSave();    
    //console.log(`Week FORWARD - WkNo: ${pc.getWeekNo()}`);
  });
  
  // << 4WK
  document.querySelector('#but_4wk_bak').addEventListener('click', function(event){
    // console.log('MOVE TO LAST 4WK CYCLE');
    
    pc.persistentSave();
        
    pc = new PayCycle4wk(...pc.getLastPayDay());  // create new payCycle object w/ LAST paydate & starting weekNo                                                  
      
    if (pc.localStorageKey in localStorage) {     // populate new payCycle w/ stored payCycle if it exists
      let jsonObj = JSON.parse(localStorage.getItem(pc.localStorageKey));
      pc.initFromJSON(jsonObj);
      console.log(pc);          
    }    
    localStorage.setItem(KEY_LAST_KNOWN_STATE, pc.localStorageKey);

    pc.updateWeekTotalMins();
    pc.finalCalculations();         
    pc.updateHTML();
  });
  
  // 4WK >>
  document.querySelector('#but_4wk_fwd').addEventListener('click', function(event){
    //console.log('MOVE TO NEXT 4WK CYCLE');  

    pc.persistentSave();
        
    pc = new PayCycle4wk(...pc.getNextPayDay());  // create new payCycle object w/ NEXT paydate & starting weekNo
      
    if (pc.localStorageKey in localStorage) {     // populate new payCycle w/ stored payCycle if it exists
      let jsonObj = JSON.parse(localStorage.getItem(pc.localStorageKey));
      pc.initFromJSON(jsonObj);
      console.log(pc);          
    }
    
    localStorage.setItem(KEY_LAST_KNOWN_STATE, pc.localStorageKey);

    pc.updateWeekTotalMins();
    pc.finalCalculations();          
    pc.updateHTML();

  });

  // store data on lost focus
  registerLostFocusCallback(function(){
    //console.log(`LostFocus, storing:${pc.localStorageKey} - - - - - - S`);
    pc.updateModelFromForms();
    pc.persistentSave();
    //console.log(`LostFocus, stored:${pc.localStorageKey} - - - - - - E`);
  });
  registerGainedFocusCallback(function(){
    pc.updateHTML();
    //console.log('GainedFocus.');
  });

  document.querySelectorAll('label.imgSelect input[accept*="image"]').forEach(item => {
    item.addEventListener('change', event => {
      console.log('TimeBox change - - - - - S');
      let fourDigitTime;
      
      //CAMERA_MODE_CAPTURE = 1; - requires HTML edit - not implemented
      if (settings.cameraMode) {
        console.log('cameraMode: CAMERA_MODE_CAPTURE');
        //console.log(event.srcElement.files[0].lastModified);
        let d = new Date(event.srcElement.files[0].lastModified);
        fourDigitTime = `${d.getHours()}${d.getMinutes()}`;
        //let timeFromLastModified = `timeFromLastModified: <${fourDigitTime}>`;
        //console.log(timeFromLastModified);
        
      } else {
        console.log('cameraMode: CAMERA_MODE_GALLERY');
        let filename = event.srcElement.files[0].name;
        console.log(filename);
  
        let hrsMins = filename.match(/\b\d{8}_(\d\d)(\d\d)\d\d\b/); // 202216181_142855.jpg
        if (hrsMins) {
          //console.log(hrsMins);      
          fourDigitTime = `${hrsMins[1]}${hrsMins[2]}`;
          console.log(`Time match: <${fourDigitTime}>`);
        } else {
          console.log(`No match in: ${filename} <`);
        }        
      }
      
      event.target.parentElement.childNodes[1].textContent = fourDigitTime; // TODO choose span element instead of hardcode 1
      pc.updateModelFromForms();
      pc.persistentSave();
      pc.updateHTML();
      console.log('TimeBox change - - - - - E');
    });
  });

  document.querySelectorAll('.break').forEach(item => {
    //console.log('Add event listener for');
    //console.log(item);
    item.addEventListener('change', event => {
      pc.updateModelFromForms();
      pc.persistentSave();
      pc.updateHTML();          
    });
  });  
  
  document.querySelectorAll('.hrs-row').forEach(item => {
    console.log(item);
    item.addEventListener('dblclick', event => {
      console.log('DB-CLICK');
      console.log(event);
      console.log(event.target);
      console.log(event.target.parentElement);
      console.log(event.target.parentElement.id);
      
      let dayNo = parseInt(event.target.parentElement.id);      
      pc.clearHours(dayNo);
      pc.persistentSave();
      pc.updateHTML();            
    });
  });

  // Mailing summary
  document.querySelector('#mail_img').addEventListener('click', function(event){
    //console.log('> = = = MAIL SUMMARY= = = <');
    let address = 'a.b@g.com';
    let subject = 'payCheck Summary';  
    window.location = `mailto:${address}?subject=${subject}&body=${pc.emailVersionSummary()}`;
  });
  
  // Debug / HELP button
  // click to create minimised 
  // transition to large by adding class
  // display info wait for click
  // transition to minimised
  // delete element on transistionend event
  // NOTE: there are transitionend AND animationend EVENTS
  if (document.querySelector('#debug_img')) {
    document.querySelector('#debug_img').addEventListener('click', function(event){  
      //displayFlash(event, id, classSpecific, classShow, innerHTML='')
      displayFlash(event, 'flash_dbg', ['flash-dbg'], 'flash-dbg-show', debugInfo());
    });
  }

  if (document.querySelector('#qr_but')) {
    document.querySelector('#qr_but').addEventListener('click', function(event){  
      //displayFlash(event, id, classSpecific, classShow, innerHTML='')
      let img = '<img src="static/assets/images/QR-code-w-icon-noShort.png">';
      displayFlash(event, 'flash_QR', ['flash-qr'], 'flash-qr-show', img);
    });  
  }


  if (document.querySelector('#calc_button')) {
    document.querySelector('#calc_button').addEventListener('click', function(event){  

      let hrs = document.querySelector('#quick_calc_hrs').value;
      let holHrs = document.querySelector('#quick_calc_hol_hrs').value;

      // TODO - add any tap on screen to re-run finalCals & screen update to remove quickCalc
      pc.finalCalculations(hrs, holHrs);
            
      // TOTALS    
      document.querySelector('#r1_anual_in').textContent = pc.annualIncomeEstimate.toFixed(2);
      document.querySelector('#r2_gross_4wk').textContent = pc.gross4wk.toFixed(2);
      document.querySelector('#r3_pension_employer').textContent = `(ERS AE PEN S: ${pc.pensionEmployer.toFixed(2)})`;
      document.querySelector('#r4_pension_employee').textContent = `AE PEN S: ${pc.pensionEmployee.toFixed(2)}`;
      document.querySelector('#r5_ni').textContent = pc.contribNI.toFixed(2);
      document.querySelector('#r6_tax').textContent = pc.incomeTax.toFixed(2);
      document.querySelector('#r7_tot_dedcts').textContent = pc.deductions.toFixed(2);
      document.querySelector('#r8_net').textContent = pc.netIncomeForCycle.toFixed(2);

      console.log('calc_button clicked');
    });  
  }  

  // export_button_save
  // export_button_get
  if (document.querySelector('#export_button_save')) {
    document.querySelector('#export_button_save').addEventListener('click', function(event){  
      console.log('[ S A V E ] JSON >> clicked');      
      pc.persistentSave();

      const button = event.target;            
      button.classList.remove('button-transition');

      pc.saveToServer()
        .then(() => {
          button.style.backgroundColor = 'green'; // Set background to green on success
          setTimeout(() => {
            button.classList.add('button-transition');
            button.style.backgroundColor = ''; // Reset to original color
          }, 1000); // 2 seconds
        })
        .catch((error) => {
          button.style.backgroundColor = 'red'; // Set background to red on failure
          setTimeout(() => {
            button.classList.add('button-transition');
            button.style.backgroundColor = ''; // Reset to original color
          }, 1000); // 2 seconds
          console.error("There was a problem with the save operation:", error);
        });      
    });  
  }


  if (document.querySelector('#export_button_get')) {
    document.querySelector('#export_button_get').addEventListener('click', function(event){  
      console.log('[ G E T ] JSON >>  clicked');
      const button = event.target;            
      button.classList.remove('button-transition');

      pc.retrieveFromServer()
        .then(() => {
          button.style.backgroundColor = 'green'; // Set background to green on success
          setTimeout(() => {
            button.classList.add('button-transition');
            button.style.backgroundColor = ''; // Reset to original color
          }, 1000); // 2 seconds
        })
        .catch((error) => {
          button.style.backgroundColor = 'red'; // Set background to red on failure
          setTimeout(() => {
            button.classList.add('button-transition');
            button.style.backgroundColor = ''; // Reset to original color
          }, 1000); // 2 seconds
          console.error("There was a problem with the retrieve operation:", error);
        });
    });  
  } 

  // Settings panel functionality
  if (document.querySelector('#settings_button')) {
    // First, create the settings panel
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'user_settings';
    settingsPanel.innerHTML = `
      <div class="settings-header">
        <h3>settings</h3>
        <button class="settings-close">&times;</button>
      </div>
      <div class="settings-form">
        <div class="settings-form-group">
          <label for="username">username</label>
          <input type="text" id="settings_username" placeholder="enter username - letters & numbers and - or _" pattern="[a-zA-Z0-9-_]+" required>
        </div>
        <div class="settings-form-group">
          <label for="password">password</label>
          <input type="password" id="settings_password" placeholder="enter password" required>
        </div>
        <div class="settings-form-group">
          <label for="contract_hours">contract hours / wk:</label>
          <input type="number" id="settings_contract_hours" step="0.5" min="0" placeholder="enter contract hours per week" required>
        </div>
      </div>
    `;
    document.body.appendChild(settingsPanel);

    // Load existing settings values if they exist
    if (settings.username) document.getElementById('settings_username').value = settings.username;
    if (settings.contractHours) document.getElementById('settings_contract_hours').value = settings.contractHours;
    
    // Toggle settings panel when button is clicked
    document.querySelector('#settings_button').addEventListener('click', function() {
      settingsPanel.classList.add('show');
    });
    
    // Close panel and save settings when X is clicked
    document.querySelector('.settings-close').addEventListener('click', function() {
      // Save settings
      settings.username = document.getElementById('settings_username').value;
      settings.password = document.getElementById('settings_password').value;
      settings.contractHours = parseFloat(document.getElementById('settings_contract_hours').value);

      document.querySelector('#quick_calc_hrs').value = settings.contractHours *4;
      document.querySelector('#quick_calc_hol_hrs').value = 0;      
      
      // Save the contract hours in both contracted hours fields
      if (settings.contractHours) {
        settings.CONTRACTED_HOURS_AC = settings.contractHours;
        //settings.CONTRACTED_HOURS_SB = settings.contractHours;
      }
      
      // Hide panel
      settingsPanel.classList.remove('show');
      
      // // Save to localStorage
      // localStorage.setItem('user_settings', JSON.stringify({
      //   username: settings.username,
      //   contractHours: settings.contractHours
      // }));
      // Save to localStorage
      localStorage.setItem('user_settings', JSON.stringify(settings));
      
      console.log('Settings saved:', settings);
    });
    
  }

  // SERVICE WORKER i/f
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/paycheck/service_worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
  
        // Send a message to the service worker to get the version number
        if (navigator.serviceWorker.controller) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.version) {
              localStorage.setItem(KEY_SW_INFO, event.data.version);
              console.log('Service Worker Version:', event.data.version);
            }
          };
          navigator.serviceWorker.controller.postMessage({ type: 'GET_SW_VERSION' }, [messageChannel.port2]);
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }  

});  // load END - - - - <



// saving images . . . 
function hasGetUserMedia() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
  // Good to go!
  console.log('hasGetUserMedia() - SUCCEEDED');
} else {
  console.log('hasGetUserMedia() - FAILED');
  // alert('getUserMedia() is not supported by your browser');
}

// - - - Getting image info - - -
// <input style='width:100%;' id="image_input" type="file" name="video" accept="image/*" capture="capture"> CAMERA
// <input style='width:100%;' id="image_input" type="file" name="video" accept="image/*" > GALLERY
//> console
//document.getElementById("image_input").files[0];
//File {  name: 'payCheckIconMain512x512.png', 
//        lastModified: 1660913175719,
//        lastModifiedDate: Fri Aug 19 2022 13:46:15 GMT+0100 (British Summer Time),
//        webkitRelativePath: '',
//        size: 20964, …}
//        
//document.getElementById("image_input").files[0].name;
//'payCheckIconMain512x512.png'
//
//document.getElementById("image_input").files[0].lastModified;
//1660913175719
//d = new Date(1660913175719)
//Fri Aug 19 2022 13:46:15 GMT+0100 (British Summer Time)
//d.getHours()
//13
//d.getMinutes()
//46
//timeIn = `${d.getHours()}${d.getMinutes()}`
//'1346'

// https://stackoverflow.com/questions/2705583/how-to-simulate-a-click-with-javascript
//document.getElementById("image_input").click();
//this is pointless because it triggers before file  / image selected / capured!

//document.getElementById("sun_in").files[0];
//
////https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event
//// attaching 
//document.getElementById("image_input").addEventListener('change', (event) => {
//  const result = document.querySelector('.result');
//  result.textContent = `You like ${event.target.value}`;
//});

// 

//// HTML & JS - to take image with CAM or pick from GALLERY
////
//// <td><input id="sun_in" type="file" name="video" accept="image/*" value="0728"></td>
//// select image from gallery - CORRECT TIME from FILENAME & LASTMODIFIED
//// document.querySelector('#sun_in').addEventListener('change', function(event){
////
//// <td><input id="mon_in" type="file" name="video" accept="image/*" capture="capture" value="0728"></td>
//// take image using camera - CORRECT TIME from LASTMODIFIED ONLY image name is '32ish decimal digits'.jpg 
//document.querySelector('#sun_in').addEventListener('change', function(event){
//  console.log('#sun_in EvntList change - - - - - S');
//  console.log(event);
//  console.log(event.srcElement.files[0]);
//  let filename = event.srcElement.files[0].name;
//  console.log(filename);
//  console.log(event.srcElement.files[0].lastModified);
//  let d = new Date(event.srcElement.files[0].lastModified);
//  let timeFromLastModified = `timeFromLastModified: ${d.getHours()} ${d.getMinutes()}`;
//  console.log(timeFromLastModified);
//  let hrsMins = filename.match(/\b\d{8}_(\d\d)(\d\d)\d\d\b/);
//  let timeMatch;
//  if (hrsMins) {
//    console.log(hrsMins);      
//    timeMatch = `${hrsMins[1]}${hrsMins[2]}`;
//    console.log(timeMatch);
//  } else {
//    timeMatch = `No match in: ${filename} <`
//    console.log(timeMatch);
//  }
//  filename = '202216181_142855.jpg';
//  hrsMins = filename.match(/\b\d{8}_(\d\d)(\d\d)\d\d\b/);
//  console.log(hrsMins);
//  document.querySelector('#dgb_03').textContent = timeFromLastModified;
//  document.querySelector('#dgb_04').textContent = timeMatch;
//  console.log('#sun_in EvntList change - - - - - E');
//});

// turning the Choose file look of the input into a box with the time in it

// More on camera access
// https://web.dev/media-capturing-images/
// more indepth
// https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos

// Storing result to Gallery


// = = = minimum 'viable product' = = = 
// Mobile display with all data summarised content sharable (eMail)
// WORKING

// CRITICAL - - - - - - - - - - - - - - - - - - - -
// works OFFLINE - DONE 
// TODO - needs a Heavier testing & data backups

// RESPONSIVE display - DONE

// NICE TO HAVE - - - - - - - - - - - - - - - - - -
// QR code to share app - DONE

// Take photo of Clock in machine store time & photo in gallery for recall if necessary
// https://stackoverflow.com/questions/23916566/html5-input-type-file-accept-image-capture-camera-display-as-image-rat

// LOW Priority - Print Summary from app - only email to self at the mo - FINE!






























// HIGH - multi user
// integrate pension calcs & update model
// add pension calcs to settings display


// synch data desktop /mobile
// need login (w/ gmail?)

// MEDIUM
// add rollover calc for (night shift workers) IE start: 2200 end 0800
//    - check epoch timestamp take care of this
// add feedback form
// add email feedback - mailto: ?
// add chat board - requires server?

// LOW
// add responsive display to include desktop
//    detecting device type mobile / desktop physical screen size in cm or inches
//    dimension show as approx:
//    desktop: 1120 x 600
//    mobile:  980 x 1964
//
//    FCC video tutorial - see
//    see repos/lang/html_css_js/css_tests : 
//
// Android Dev info
// https://developer.android.com/guide/practices/screens_support
// Media Query for different Devices
// https://css-tricks.com/snippets/css/media-queries-for-standard-devices/
