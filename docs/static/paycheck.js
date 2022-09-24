
import {registerGainedFocusCallback, registerLostFocusCallback} from './focus.js';

function cl(args) {
  console.log(args);
};

// where to look in local storage for current state
const KEY_LAST_KNOWN_STATE = 'state_key';
const KEY_SW_INFO          = 'sw_info';   // must match in SW!

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
    //cl('initFromJSON-DAY() - - - - - - - - S');
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
    //cl(`initJSON-DAY(): ${this.day}-${this.HRdate}:${this.inTime}-${this.breakTime}-${this.outTime}`);
    //cl('initFromJSON-DAY() - - - - - - - - E');
  }
  
  setHours(start, breakStr, finish){
    this.inTime = start;        // 0728
    this.breakTime = breakStr;  // 30     break time in mins / or  AL anual leave
    this.outTime = finish;      // 1553
    //cl(`in: ${start} break: ${breakStr} out: ${finish}`);
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
      //cl(`finish: ${finish} -: ${toEnd} - hrs: ${hrsF} - mins:${minF} - hrs ${finish.slice(0,2)}`);
      
      // start time to mins inc 15m roundup
      let hrsS = parseInt(start.substr(0,2));
      let minS = parseInt(start.substr(2,4));
      
      //let roundupMins = minS + (15 - (minS % 15));                  // round up to the next nearest 15min 0701 = 0715 walmart sneakiness
      let roundupMins = minS? (minS-1) + (15 - ((minS-1) % 15)) : 0;  // round to nearest 15m  0=0, 1-15=15, 16-30=30, 31-45=45, 46-59=60
      let fromStart = hrsS*60 + roundupMins;
      
      //cl(`start: ${start} -: ${fromStart} - hrs: ${hrsS} - mins:${minS} - rnd:${roundupMins} - hrs ${start.slice(0,2)}`);
      
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

class PayCycle4wk{
  static OFFSET_CUTOFF = -6;
  static OFFSET_START = -33;
  static DAYS_IN_CYCLE = 28;
  static prefixes = ['sun','mon','tue','wed','thu','fri','sat'];
  static postfixes = ['_date_js','_in','_break','_out','_hrs','_dhrs','',''];
  
  static nextPayDayAfterToday(thisDate = new Date()) {
    let refDate = new Date('2022-08-12T04:00:00');
    let refWeekNo = 28;
    let thisDayMsSinceEpoch = thisDate.getTime();
    
    for (let i=0; i<200; i+=1) {  // 13 steps = 1 year (52 / 4week cycle)
      if (thisDayMsSinceEpoch < refDate.getTime()) return [refDate, refWeekNo];
      refDate.addDays(28);
      refWeekNo += 4;
      if (refWeekNo > 52) refWeekNo = refWeekNo - 52;
      //cl(`nextPD: ${refWeekNo} - ${refDate.toISOString()} - ${refDate.getTime()} - ${refMsSinceEpoch}`);
    }
    
    // catch
    refDate = new Date('2022-08-12T04:00:00'); refWeekNo = 28;
    return [refDate, refWeekNo];
  }
    
  static highLightTodaysEntry(element=undefined){
    if (element) {
      document.querySelector('#date-today').classList.add('day-highlight');
      element.classList.add('day-highlight');
      setTimeout( ()=>{document.querySelector('#date-today').classList.remove('day-highlight');} ,10);
      setTimeout( ()=>{element.classList.remove('day-highlight');} ,10);
    }    
  }
  
  constructor(payDay, startWkNo){ // let pc = new PayCycle4wk(new Date(2022, 07, 12)); // the month is 0-indexed
    this.payDay   = payDay;
    this.cutOff   = payDay.copyAddDays(PayCycle4wk.OFFSET_CUTOFF);
    this.payStart = payDay.copyAddDays(PayCycle4wk.OFFSET_START);
    this.weekNo   = 0;  // 0-3
    this.weekNos  = [startWkNo, (startWkNo+1) % 52, (startWkNo+2) % 52, (startWkNo+3) % 52];
    this.weekTotalMins = [0,0,0,0];
    this.weekTotalALMins = [0,0,0,0];
    this.cycleTotalMins = 0;
    this.cycleTotalALMins = 0;
    
    // localstorage key format: 2022_HRS_28-31_12AUG      
    this.localStorageKey = `${this.payDay.getFullYear()}_HRS_${this.weekNos[0]}-${this.weekNos[3]}_${this.payDay.getDate()}${Day.numToMonth[this.payDay.getMonth()]}`.toUpperCase();
    this.daysInCycle = [];
    
    var date = this.payStart;
    for (let dayNo = 0; dayNo < PayCycle4wk.DAYS_IN_CYCLE; dayNo +=1) {
      this.daysInCycle.push(new Day(date));
      date = date.copyAddDays(1);
    }
    
    this.gross4wk = 0;
    this.annualIncomeEstimate = 0;
    this.pensionContrib = 0;
    this.contribNI = 0;
    this.incomeTax = 0;    
    this.deductions = 0;    
    this.netIncomeForCycle = 0;
  }
  
  initFromJSON(jsonObj){ // let dt = new Date("2022-08-06T03:00:00.000Z")
    //cl('initFromJSON() - - - - - - - - S');
    this.payDay           = new Date(jsonObj.payDay);   //cl(jsonObj.payDay']);  
    this.cutOff           = new Date(jsonObj.cutOff);   //cl(jsonObj.cutOff']);
    this.payStart         = new Date(jsonObj.payStart); //cl(jsonObj.payStart']);
    this.weekNo           = jsonObj.weekNo;             //cl(jsonObj.weekNo']);
    this.weekNos          = jsonObj.weekNos;            //cl(jsonObj.weekNos']);
    this.localStorageKey  = jsonObj.localStorageKey;    //cl(jsonObj.localStorageKey']);    
    for (let dayNo = 0; dayNo < PayCycle4wk.DAYS_IN_CYCLE; dayNo +=1) {
      this.daysInCycle[dayNo].initFromJSON(jsonObj.daysInCycle[dayNo]);
    }
    //cl(`initFromJSON-4WK(): ${this.payDay}-${this.localStorageKey}:${this.weekNos}`);
    //cl('initFromJSON() - - - - - - - - E');
  }

  clearHours(dayNo){
    if ((dayNo >= 0) && (dayNo < PayCycle4wk.DAYS_IN_CYCLE)) {
      this.daysInCycle[dayNo].clearHours();
    } else {
      // TODO raise
      //cl(`clearHours FAILED - dayNo:${dayNo} - OUT OF RANGE Should be 0-${PayCycle4wk.DAYS_IN_CYCLE}`);
    }
  }
  
  weekBak(){
    if (this.weekNo > 0) this.weekNo -= 1;
  }
  
  weekFwd(){
    if (this.weekNo < 3) this.weekNo += 1;    
  }
  
  getWeekNo(no=-1){
    let wkNoIndex = no;
    if      (no < 0) { wkNoIndex = this.weekNo; }
    else if (no > 3) { wkNoIndex = this.weekNo; }

    return this.weekNos[wkNoIndex];
  }
  
  getWeekNoDateRange(){
    let start = this.daysInCycle[this.weekNo * 7];    // cl(start);
    let end = this.daysInCycle[(this.weekNo * 7)+6];  // cl(end);
    return `${this.weekNo+1} / ${this.weekNos[this.weekNo]} ~  ${start.HRdate} - ${end.HRdate}`;
  }
  
  getNextPayDay(){
    var returnDate = this.payDay.copyAddDays(PayCycle4wk.DAYS_IN_CYCLE);
    var weekNo = this.weekNos[0] += 4;
    if (weekNo > 52) weekNo = weekNo - 52;
    return [returnDate, weekNo];
  }
  
  getLastPayDay(){
    var returnDate = this.payDay.copyAddDays(PayCycle4wk.DAYS_IN_CYCLE*-1);
    var weekNo = this.weekNos[0] -= 4;
    if (weekNo < 1) weekNo = weekNo + 52;
    return [returnDate, weekNo];    
  }
  
  updateWeekTotalMins(){
    let dayOfMonth = 0;
    for (let wkNo = 0; wkNo < 4; wkNo +=1) {
      let weekTotal = 0;
      let weekALTotal = 0;
      for (let dayNo = 0; dayNo < 7; dayNo +=1) {
        dayOfMonth = 7 * wkNo + dayNo;
        weekTotal += this.daysInCycle[dayOfMonth].totalMins;
        weekALTotal += this.daysInCycle[dayOfMonth].totalALMins;
      }
      this.weekTotalMins[wkNo] = weekTotal;
      this.weekTotalALMins[wkNo] = weekALTotal;
    }
    this.cycleTotalMins = 0;
    this.cycleTotalALMins = 0;
    for (let wkNo = 0; wkNo < 4; wkNo +=1) {
      this.cycleTotalMins += this.weekTotalMins[wkNo];
      this.cycleTotalALMins += this.weekTotalALMins[wkNo];
    }    
  }
  
  finalCalulations(){
    // TODO - move to settings
    // https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2022-to-2023
    const TAX_RATE_2022 = 0.20;
    const TAX_2022_ALLOWANCE = 12570;     // 12570-37700 @20% 37701-150000 @40% rest @45%
    const NI_RATE_2022_23 = 0.1325;       // for 2022 to 2023 tax year, returns to 0.12 after that when new tax being introduced
    const NI_2022_23_ALLOWANCE = 12584;   // 242/wk  . . was const NI_2022_ALLOWANCE = 9564; 
    const HOURLY_RATE_2022 = 10.10;
    const HOURLY_RATE_AL_2022 = HOURLY_RATE_2022 * 1.2; // its more complicated than this - find out details TODO
    const PENSION_PC = 0.031;
    
    // anual /4 * 52
    let hoursForCycle = parseFloat(Day.minsToHDecimalReadable(this.cycleTotalMins));
    let hoursALForCycle = parseFloat(Day.minsToHDecimalReadable(this.cycleTotalALMins));
    this.gross4wk = (hoursForCycle * HOURLY_RATE_2022) + (hoursALForCycle * HOURLY_RATE_AL_2022);
    this.annualIncomeEstimate = this.gross4wk / 4 * 52;
    
    // TODO check if there's a threshold as in NI/Tax
    // TODO add model to replace flat rate
    // pension contribution - pre tax - ~3.1% use LUT
    this.pensionContrib = this.annualIncomeEstimate * PENSION_PC / 52 * 4;
    
    // NI @ 12% Allowance 9564
    if (this.annualIncomeEstimate > NI_2022_23_ALLOWANCE) {
      this.contribNI = (( this.annualIncomeEstimate - NI_2022_23_ALLOWANCE ) * NI_RATE_2022_23 ) / 52 * 4;
    } else {
      this.contribNI = 0;
    }    
    
    // Tax @ 20% Allowance 12570
    if (this.annualIncomeEstimate > TAX_2022_ALLOWANCE) {
      this.incomeTax = (( this.annualIncomeEstimate - TAX_2022_ALLOWANCE ) * TAX_RATE_2022 ) / 52 * 4;
    } else {
      this.incomeTax = 0;
    }    
    
    this.deductions = this.incomeTax + this.contribNI + this.pensionContrib;    
    this.netIncomeForCycle = this.gross4wk - this.deductions;
  }
  
  persistentSave(){
    localStorage.setItem(this.localStorageKey, JSON.stringify(this));
  }
  
  // call on submit & week change  
  updateModelFromForms(){
    // cycle through days parse content into relevant object
    //cl('> - - - processing form data');
    let startDay = this.weekNo * 7;
    for (let dayNo = startDay; dayNo < startDay+7; dayNo +=1) {
      let start = document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_in`).textContent.trim();
      
      // drop down input: value/placeholder
      let value = document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_break`).value.trim();
      let placeholder = document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_break`).placeholder.trim();      
      let breakStr = (value) ? value : placeholder;
      
      let finish = document.querySelector(`#${PayCycle4wk.prefixes[dayNo % 7]}_out`).textContent.trim();
      //cl(`==: ${startDay} - ${dayNo} - ${this.daysInCycle[dayNo].HRdate} :== S`);
      this.daysInCycle[dayNo].setHours(start, breakStr, finish);
      //cl(`==: ${this.daysInCycle[dayNo].HRdate} :== E`);
    }
    this.updateWeekTotalMins();
    this.finalCalulations();
  }
  
  updateHTML(){
    // TODAYS DATE
    let todayClockElement;
    let today = new Day(new Date());
    document.querySelector('#date-today-day').textContent = today.day;
    document.querySelector('#date-today-date').textContent = today.HRdate;
    document.querySelector('#date-today-year').textContent = today.year;
    
    // HEADER - update pay_day, cut_off, wk_range = week no's, wk_range_dates 4week date range
    document.querySelector('#pay_day_js').textContent = `Pay Day: ${this.payDay.getDate()} ${Day.numToMonth[this.payDay.getMonth()]}`;
    document.querySelector('#wk_range_js').textContent = ` ${this.getWeekNo(0)} - ${this.getWeekNo(3)}`;
    document.querySelector('#wk_range_dates_js').textContent = `${this.payStart.getDate()} ${Day.numToMonth[this.payStart.getMonth()]} - ${this.cutOff.getDate()} ${Day.numToMonth[this.cutOff.getMonth()]}`;
    document.querySelector('#wk_no_js').textContent = this.getWeekNoDateRange();
    
    // HOURS TABLE
    let startDay = this.weekNo * 7;
    let tableRowElements = document.querySelectorAll('.hrs-row');
    for (let dayNo = startDay; dayNo < startDay+7; dayNo +=1) {
      //cl(`${startDay} - ${dayNo} - ${this.daysInCycle[dayNo].day} - ${this.daysInCycle[dayNo].HRdate}`);
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
      //cl(`wkNo:${weekNo} - hrs:${Day.minsToHMReadable(this.weekTotalMins[weekNo])} - Dhrs:${Day.minsToHDecimalReadable(this.weekTotalMins[weekNo])}`);
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
    
    // MONTHLY TOTAL
    document.querySelector(`#r5_tot_hrs`).textContent = Day.minsToHMReadable(this.cycleTotalMins + this.cycleTotalALMins);
    document.querySelector(`#r5_tot_dhrs`).textContent =  Day.minsToHDecimalReadable(this.cycleTotalMins + this.cycleTotalALMins);
    
    // TOTALS    
    document.querySelector('#r1_anual_in').textContent = this.annualIncomeEstimate.toFixed(2);
    document.querySelector('#r2_gross_4wk').textContent = this.gross4wk.toFixed(2);
    document.querySelector('#r3_pension').textContent = this.pensionContrib.toFixed(2);
    document.querySelector('#r4_ni').textContent = this.contribNI.toFixed(2);
    document.querySelector('#r5_tax').textContent = this.incomeTax.toFixed(2);
    document.querySelector('#r6_tot_dedcts').textContent = this.deductions.toFixed(2);
    document.querySelector('#r7_net').textContent = this.netIncomeForCycle.toFixed(2);
    
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
    return t0.padEnd(p0) + t1.padEnd(p1) +
           t2.padEnd(p2) + t3.padEnd(p3) +
           t4.padEnd(p4) + t5.padEnd(p5) +
           t6.padEnd(p6) + t7.padEnd(p7) + '\n';
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
    
    cl(textSummary);

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
const CAMERA_MODE_GALLERY = 0;
const CAMERA_MODE_CAPTURE = 1;
var settings = {
  cameraMode: CAMERA_MODE_GALLERY,
  showExceptions: true,
};
var stateKey = '';
//cl(pc);

if (KEY_LAST_KNOWN_STATE in localStorage) {  // retrieve current statekey, and 4wk cycle object
  stateKey = localStorage.getItem(KEY_LAST_KNOWN_STATE);
  if (stateKey in localStorage) {
    let jsonObj = JSON.parse(localStorage.getItem(stateKey));
    pc.initFromJSON(jsonObj);
    cl(`LOADED PayCycle4wk object key: ${stateKey} < from localStrorage\n- KEYS Match: ${stateKey === pc.localStorageKey}`);  
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
  debugText += addDebugLine('');
  debugText += addDebugLine(`paycheck.js V00.05 / SW 00.21`);
  debugText += addDebugLine('');
  debugText += addDebugLine('');
  
  if (KEY_SW_INFO in localStorage) {
    swInfo = localStorage.getItem(KEY_SW_INFO);
    
    debugText += addDebugLine(`SW version: ${swInfo.swVersion}`);
    debugText += addDebugLine(`cache: ${swInfo.cacheName}`);
  } else {
    debugText += addDebugLine('** WARNING **');
    debugText += addDebugLine(`KEY: ${KEY_SW_INFO} < Not found.`);
  }
  
  return debugText;
}

function displayFlash(event, id, classSpecific, classShow, innerHTML='') {
  cl(`> = = = POP FLASH ${id} = = = <`);
  let targetBtn = event.target;
  let debugDiv = document.createElement('div');
  debugDiv.id = id;
  debugDiv.classList.add("flash", ...classSpecific); // add remove toggle
  //debugDiv.innerHTML = debugInfo();
  debugDiv.innerHTML = innerHTML;
  document.body.appendChild(debugDiv);
  targetBtn.classList.add('btn-disable');
  
  setTimeout(()=>{debugDiv.classList.add(classShow); cl('-SHOW-');}, 5);  
  
  document.getElementById(id).addEventListener('click', function(event){
    cl(`> = = = HIDE FLASH ${id} = = = <`);
    debugDiv.addEventListener('transitionend', (event)=>{ // NOT animationend
      debugDiv.remove();
      targetBtn.classList.remove('btn-disable');
      //cl('-transitionEnd-');
    });    
    debugDiv.classList.remove(classShow);  // NOT animate! TRANSITION!
  });  
}

window.addEventListener('load',function(){
  cl('LOADED - adding event listeners');
  pc.updateWeekTotalMins();
  pc.finalCalulations();  
  pc.updateHTML();
  cl(pc);
  
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
    // cl('MOVE TO LAST 4WK CYCLE');
    
    pc.persistentSave();
        
    pc = new PayCycle4wk(...pc.getLastPayDay());  // create new payCycle object w/ LAST paydate & starting weekNo                                                  
      
    if (pc.localStorageKey in localStorage) {     // populate new payCycle w/ stored payCycle if it exists
      let jsonObj = JSON.parse(localStorage.getItem(pc.localStorageKey));
      pc.initFromJSON(jsonObj);
      cl(pc);          
    }    
    localStorage.setItem(KEY_LAST_KNOWN_STATE, pc.localStorageKey);

    pc.updateWeekTotalMins();
    pc.finalCalulations();         
    pc.updateHTML();
  });
  
  // 4WK >>
  document.querySelector('#but_4wk_fwd').addEventListener('click', function(event){
    //cl('MOVE TO NEXT 4WK CYCLE');  

    pc.persistentSave();
        
    pc = new PayCycle4wk(...pc.getNextPayDay());  // create new payCycle object w/ NEXT paydate & starting weekNo
      
    if (pc.localStorageKey in localStorage) {     // populate new payCycle w/ stored payCycle if it exists
      let jsonObj = JSON.parse(localStorage.getItem(pc.localStorageKey));
      pc.initFromJSON(jsonObj);
      cl(pc);          
    }
    
    localStorage.setItem(KEY_LAST_KNOWN_STATE, pc.localStorageKey);

    pc.updateWeekTotalMins();
    pc.finalCalulations();          
    pc.updateHTML();

  });

  // store data on lost focus
  registerLostFocusCallback(function(){
    //cl(`LostFocus, storing:${pc.localStorageKey} - - - - - - S`);
    pc.updateModelFromForms();
    pc.persistentSave();
    //cl(`LostFocus, stored:${pc.localStorageKey} - - - - - - E`);
  });
  registerGainedFocusCallback(function(){
    pc.updateHTML();
    //cl('GainedFocus.');
  });

  document.querySelectorAll('label.imgSelect input[accept*="image"]').forEach(item => {
    item.addEventListener('change', event => {
      cl('TimeBox change - - - - - S');
      let fourDigitTime;
      
      //CAMERA_MODE_CAPTURE = 1; - requires HTML edit - not implemented
      if (settings.cameraMode) {
        cl('cameraMode: CAMERA_MODE_CAPTURE');
        //cl(event.srcElement.files[0].lastModified);
        let d = new Date(event.srcElement.files[0].lastModified);
        fourDigitTime = `${d.getHours()}${d.getMinutes()}`;
        //let timeFromLastModified = `timeFromLastModified: <${fourDigitTime}>`;
        //cl(timeFromLastModified);
        
      } else {
        cl('cameraMode: CAMERA_MODE_GALLERY');
        let filename = event.srcElement.files[0].name;
        cl(filename);
  
        let hrsMins = filename.match(/\b\d{8}_(\d\d)(\d\d)\d\d\b/); // 202216181_142855.jpg
        if (hrsMins) {
          //cl(hrsMins);      
          fourDigitTime = `${hrsMins[1]}${hrsMins[2]}`;
          cl(`Time match: <${fourDigitTime}>`);
        } else {
          cl(`No match in: ${filename} <`);
        }        
      }
      
      event.target.parentElement.childNodes[1].textContent = fourDigitTime; // TODO choose span element instead of hardcode 1
      pc.updateModelFromForms();
      pc.persistentSave();
      pc.updateHTML();
      cl('TimeBox change - - - - - E');
    });
  });

  document.querySelectorAll('.break').forEach(item => {
    //cl('Add event listener for');
    //cl(item);
    item.addEventListener('change', event => {
      pc.updateModelFromForms();
      pc.persistentSave();
      pc.updateHTML();          
    });
  });  
  
  document.querySelectorAll('.hrs-row').forEach(item => {
    cl(item);
    item.addEventListener('dblclick', event => {
      cl('DB-CLICK');
      cl(event);
      cl(event.target);
      cl(event.target.parentElement);
      cl(event.target.parentElement.id);
      
      let dayNo = parseInt(event.target.parentElement.id);      
      pc.clearHours(dayNo);
      pc.persistentSave();
      pc.updateHTML();            
    });
  });

  // Mailing summary
  document.querySelector('#mail_img').addEventListener('click', function(event){
    //cl('> = = = MAIL SUMMARY= = = <');
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
      let img = '<img src="static/images/QR-code-w-icon-noShort.png">';
      displayFlash(event, 'flash_QR', ['flash-qr'], 'flash-qr-show', img);
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
  cl('hasGetUserMedia() - SUCCEEDED');
} else {
  cl('hasGetUserMedia() - FAILED');
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
//  cl('#sun_in EvntList change - - - - - S');
//  cl(event);
//  cl(event.srcElement.files[0]);
//  let filename = event.srcElement.files[0].name;
//  cl(filename);
//  cl(event.srcElement.files[0].lastModified);
//  let d = new Date(event.srcElement.files[0].lastModified);
//  let timeFromLastModified = `timeFromLastModified: ${d.getHours()} ${d.getMinutes()}`;
//  cl(timeFromLastModified);
//  let hrsMins = filename.match(/\b\d{8}_(\d\d)(\d\d)\d\d\b/);
//  let timeMatch;
//  if (hrsMins) {
//    cl(hrsMins);      
//    timeMatch = `${hrsMins[1]}${hrsMins[2]}`;
//    cl(timeMatch);
//  } else {
//    timeMatch = `No match in: ${filename} <`
//    cl(timeMatch);
//  }
//  filename = '202216181_142855.jpg';
//  hrsMins = filename.match(/\b\d{8}_(\d\d)(\d\d)\d\d\b/);
//  cl(hrsMins);
//  document.querySelector('#dgb_03').textContent = timeFromLastModified;
//  document.querySelector('#dgb_04').textContent = timeMatch;
//  cl('#sun_in EvntList change - - - - - E');
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

// TODO - SINGLE USER

// CRITICAL - - - - - - - - - - - - - - - - - - - -
// works OFFLINE

// RESPONSIVE display


// NICE TO HAVE - - - - - - - - - - - - - - - - - -
// QR code to share app

// Take photo of Clock in machine store time & photo in gallery for recall if necessary
// https://stackoverflow.com/questions/23916566/html5-input-type-file-accept-image-capture-camera-display-as-image-rat

// Print Summary from app

// add QR code to spread app




























// HIGH - multi user
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
