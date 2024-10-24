const form = document.querySelector('#calculator');
const logNode = document.querySelector('#log');
const monthlySalaryNode = document.querySelector('#monthly-salary');
const formulaNode = document.querySelector('#formula');

SALARY_PERIOD = {
    'MONTH': 'в месяц',
    'DAY': 'за смену',
    'HOUR': 'за час',
    'FIFO': 'за вахту',
}

const DAY_IN_MONTH = 30

const SCHEDULE_FULL_DAY_HOURS = 24
const SCHEDULE_HALF_DAY_HOURS = 12
const SCHEDULE_WEEK_DAY_HOURS = 8

const SCHEDULE_5_TO_2_COEFF = 0.7143
const SCHEDULE_2_TO_2_COEFF = 0.5
const SCHEDULE_1_TO_2_COEFF = 0.333


const SHIFT_TO_HOURS = {
    '6/1': 8,
    '5/2': 8,
    '4/3': 12,
    '4/2': 12,
    '3/3': 12,
    '3/2': 12,
    '2/2': 12,
    '2/1': 12,
    '2/5': 12,
    '1/3': 24,
    '1/2': 24,
}

let shift_coeffs = [];
let hour_coeffs = [];
let formulaFrom = '';
let formulaTo = '';
let schedules_calculated = [];
let hours_calculated= [];

function get_work_coefficient(schedule_list) {
    /**
     * Вычисляем отношения рабочих дней к общему числу дней в рабочем цикле
     * :param schedule_list: список графика работы в формате '{к-во рабочих}/{к-во выходных}'
     */
    schedule_list_int = schedule_list.map((schedule) => schedule.split('/'));
    return schedule_list_int.map((item) => parseInt(item[0]) / (parseInt(item[0]) + parseInt(item[1])));

}


function calc_salary_from_hour(
    salary_from,
    salary_to,
    schedule_list = [],
    hours_count = [],
) {
/**
    Пересчет часовой зарплаты в месячную
    :param salary_from: нижняя граница зарплаты в часах
    :param salary_to: верхняя граница зарплаты в часах
    :param schedule_list: список графиков работы в формате '{к-во рабочих}/{к-во выходных}'
    :param hours_count: список часов в рабочей смене
    :return: tuple[нижняя граница зарплаты в месяц, верхняя граница зарплаты в месяц]
 */
    const coef_candidate = []

    if (schedule_list.length > 0) {
        coef_weekday = get_work_coefficient(schedule_list)

        // # Разбиваем часы на три группы для разных типов работы (до 8 часов, от 9 до 12, больше 12 часов)
        hours_group1 = hours_count.filter((item) => item <= SCHEDULE_WEEK_DAY_HOURS)
        hours_group2 = hours_count.filter((item) => item <= SCHEDULE_HALF_DAY_HOURS)
        hours_group3 = hours_count.filter((item) => item <= SCHEDULE_FULL_DAY_HOURS)

        // # дефолтные значения часов для каждой из трех групп
        if (!hours_group1.length) {
            hours_group1 = [SCHEDULE_WEEK_DAY_HOURS]
        }
        if (!hours_group2.length) {
            hours_group2 = [SCHEDULE_HALF_DAY_HOURS]
        }
        if (!hours_group3.length) {
            hours_group3 = [SCHEDULE_FULL_DAY_HOURS]
        }

        // # Для каждого графика работы смотрим только те часы, которые ему могут соответствовать
        schedule_list.forEach((schedule, i) => {
            if (SHIFT_TO_HOURS[schedule] === SCHEDULE_WEEK_DAY_HOURS) {
                hours_group1.forEach((hour) => {
                    coef_candidate.push(coef_weekday[i] * hour)
                })
            } else if (SHIFT_TO_HOURS[schedule] == SCHEDULE_HALF_DAY_HOURS) {
                hours_group2.forEach((hour) => {
                    coef_candidate.push(coef_weekday[i] * hour)
                })
            } else if (SHIFT_TO_HOURS[schedule] == SCHEDULE_FULL_DAY_HOURS) {
                hours_group3.forEach((hour) => {
                    coef_candidate.push(coef_weekday[i] * hour)
                })
            }
        })
    } else {
        if (!hours_count.length) {
            // дефолтные значения часов для каждой из трех групп
            hours_count = [SCHEDULE_WEEK_DAY_HOURS, SCHEDULE_HALF_DAY_HOURS, SCHEDULE_FULL_DAY_HOURS]
        }

        // Для каждого часа ставим дефолтный график, которые ему может соответствовать
        hours_count.forEach((hour) => {
            if (hour <= SCHEDULE_WEEK_DAY_HOURS) {
                coef_candidate.push(SCHEDULE_5_TO_2_COEFF * hour)
            } else if ((SCHEDULE_WEEK_DAY_HOURS < hour) && (hour <= SCHEDULE_HALF_DAY_HOURS)) {
                coef_candidate.push(SCHEDULE_2_TO_2_COEFF * hour)
            } else {
                coef_candidate.push(SCHEDULE_1_TO_2_COEFF * hour)
            }
        });
    }

    schedules_calculated = schedule_list;
    hours_calculated = hours_count;

    formulaFrom = `${DAY_IN_MONTH} * ${Math.min(...coef_candidate)} * ${salary_from}`;
    formulaTo = `${DAY_IN_MONTH} * ${Math.max(...coef_candidate)} * ${salary_to}`;

    return {
        from: DAY_IN_MONTH * Math.min(...coef_candidate) * salary_from,
        to: DAY_IN_MONTH * Math.max(...coef_candidate) * salary_to,
    }
}


function calc_salary_from_shift(
    salary_from,
    salary_to,
    schedule_list = [],
) {
/**
    Пересчет зарплаты за смену в месячную
    :param salary_from: нижняя граница зарплаты в часах
    :param salary_to: верхняя граница зарплаты в часах
    :param schedule_list: список графиков работы в формате '{к-во рабочих}/{к-во выходных}'
    :return: tuple[нижняя граница зарплаты в месяц, верхняя граница зарплаты в месяц]
 */
    if (schedule_list.length > 0) {
        coef_weekday = get_work_coefficient(schedule_list)
        console.log(coef_weekday)
        coef_weekday_from = Math.min(...coef_weekday)
        coef_weekday_to = Math.max(...coef_weekday)
    } else {
        coef_weekday_from = SCHEDULE_2_TO_2_COEFF  // График 2/2
        coef_weekday_to = SCHEDULE_5_TO_2_COEFF  // График 5/2
    }

    schedules_calculated = schedule_list;

    formulaFrom = `${DAY_IN_MONTH} * ${coef_weekday_from} * ${salary_from}`;
    formulaTo = `${DAY_IN_MONTH} * ${coef_weekday_to} * ${salary_to}`;

    return {
        from: DAY_IN_MONTH * coef_weekday_from * salary_from,
        to: DAY_IN_MONTH * coef_weekday_to * salary_to,
    }
}


function calc_salary_for_fifo(salary_from, salary_to, number_of_shifts = [DAY_IN_MONTH]) {
    /**
     Пересчет зарплаты за вахту в месячную
     :param salary_from: нижняя граница зарплаты в часах
     :param salary_to: верхняя граница зарплаты в часах
     :param number_of_shifts: список к-ва дней в вахте
     :return: tuple[нижняя граница зарплаты в месяц, верхняя граница зарплаты в месяц]
     */
    const n_months = number_of_shifts.map((item) => Math.max(1, item / DAY_IN_MONTH));
    const n_months_left = Math.min(...n_months);
    const n_months_right = Math.max(...n_months);

    schedules_calculated = n_months;

    formulaFrom = `${salary_from} / ${n_months_left}`;
    formulaTo = `${salary_to} / ${n_months_right}`;

    return {
        from: salary_from / n_months_left,
        to: salary_to / n_months_right,
    }
}

function formatSalary(value) {
    return new Intl.NumberFormat("ru-RU").format(Math.round(value))
}


form.addEventListener('change', function() {
    const salaryFrom = form.salaryFrom.value;
    const salaryTo = form.salaryTo.value;
    const salaryPeriod = form['salary-period'].value
    const fifoDays = [parseInt(form['fifo_days'].value)];

    // Заполняем выбранные графики работы
    let schedules = [];
    for (let s of form.schedule) {
        if (s.checked === true && s.value !== 'FREE' && s.value !== 'OTHER') {
            schedules.push(s.value);
        }
    }

    // Заполняем выбранные рабочие часы в день
    let workHours = [];
    for (let h of form.hours){
        if(h.checked === true && h.value !== 'BY_AGREEMENT' && h.value !== 'OTHER'){
            workHours.push(parseInt(h.value));
        }
    }

    let monthlySalary = {}

    if (salaryPeriod === 'DAY') {
        monthlySalary = calc_salary_from_shift(salaryFrom, salaryTo, schedules);
    } else if (salaryPeriod === 'HOUR') {
        monthlySalary = calc_salary_from_hour(salaryFrom, salaryTo, schedules, workHours);
    } else if (salaryPeriod === 'FIFO') {
        monthlySalary = calc_salary_for_fifo(salaryFrom, salaryTo, [fifoDays])
    } else {
        monthlySalary = {
            from: salaryFrom,
            to: salaryTo,
        };
    }

    logNode.innerHTML = `
        <br>Исходныя зарплата: от ${formatSalary(salaryFrom)} до ${formatSalary(salaryTo)} ${SALARY_PERIOD[salaryPeriod]}
        <br>Рассчитанная зарплата: от ${formatSalary(monthlySalary.from)} до ${formatSalary(monthlySalary.to)} ${SALARY_PERIOD['MONTH']}
        <br>Смены: ${schedules_calculated.join(', ')}
        <br>Часы: ${hours_calculated.join(', ')}
        <br>Формула от ${formulaFrom} = ${formatSalary(monthlySalary.from)}
        <br>Формула до ${formulaTo} = ${formatSalary(monthlySalary.to)}
    `

    // console.log(`от ${formatSalary(monthlySalary.from)} до ${formatSalary(monthlySalary.to)}`);
    // console.log(`от ${formatSalary(monthlySalary.from)} до ${formatSalary(monthlySalary.to)}`);

    monthlySalaryNode.innerHTML = `от ${formatSalary(monthlySalary.from)} до ${formatSalary(monthlySalary.to)}`;
})