const form = document.querySelector('#calculator');
const monthlySalaryNode = document.querySelector('#monthly-salary');

// За месяц:
//     Sal_m - зарплата в месяц
// Используется указанное значение.
//     За смену:
//     Sal_m = 30*work/(work+relax)*Sal_s
// Sal_s - зарплата в смену
// В час:
//     Sal_m = 30*work/(work+relax)*h_cnt*Sal_h
// Sal_h - зарплата в час
// h_cnt - количество часов

function formatSalary(value) {
    if (isNaN(value)) {
        return 'НЕЛЬЗЯ РАССЧИТАТЬ'
    }
    return new Intl.NumberFormat("ru-RU").format(Math.round(value))
}

form.addEventListener('change', function() {
    const salaryFrom = form.salaryFrom.value;
    const salaryTo = form.salaryTo.value;
    const salaryPeriod = form['salary-period'].value
    const fifoDays = form['fifo_days'].value;

    let schedule = [];
    let workDays = [];
    let relaxDays = [];
    for (let s of form.schedule){
        if(s.checked === true){
            schedule.push(s.value);
        }
    }

    schedule.forEach((item) => {
        const days = item.split('/');
        workDays.push(parseInt(days[0]));
        relaxDays.push(parseInt(days[1]));
    });

    workDays = workDays.filter((d) => !isNaN(d));
    relaxDays = relaxDays.filter((d) => !isNaN(d));

    let workHours = [];
    for (let h of form.hours){
        if(h.checked === true){
            workHours.push(parseInt(h.value));
        }
    }

    workHours = workHours.filter((d) => !isNaN(d ));

    if (!workHours.length && !(!workDays.length || !relaxDays.length)) {
        if (schedule.includes('5/2') || schedule.includes('6/1')) {
            workHours.push(8);
        } else if (schedule.includes('1/2') || schedule.includes('1/3')) {
            workHours.push(24);
        } else {
            workHours.push(12);
        }
    }

    if ((!workDays.length || !relaxDays.length) && workHours.length) {
        if (workHours.includes(8)) {
            workDays.push(5);
            relaxDays.push(2);
        } else if (workHours.includes(12)) {
            workDays.push(2);
            relaxDays.push(2);
        } else if (workHours.includes(24)) {
            workDays.push(1);
            relaxDays.push(2);
        }
    }

    let minWorkDays = Math.min(...workDays);
    let maxWorkDays = Math.max(...workDays);
    let minRelaxDays = Math.min(...relaxDays);
    let maxRelaxDays = Math.max(...relaxDays);

    let minWorkHours = workHours.length ? Math.min(...workHours) : NaN;
    let maxWorkHours = workHours.length ? Math.max(...workHours) : NaN;


    let monthlySalaryFrom = form.salaryFrom.value
    let monthlySalaryTo = form.salaryTo.value

    console.log('jhlkjhlkhlkhlkjhlkjhlkhj')
    console.log(workHours, workDays, relaxDays)

    if (!workHours.length && (!workDays.length || !relaxDays.length)) {
        // График 5/2, 8 часов (171.4 часа в месяц) -- зп "от"
        // Графиу 2/2, 12 часов (180 часов в месяц) -- зп "до"
        minWorkDays = 5;
        minRelaxDays = 2;
        minWorkHours = 8;
        maxWorkDays = 2;
        maxRelaxDays = 2;
        maxWorkHours = 12;
    }

    if (salaryPeriod === 'DAY') {
        monthlySalaryFrom = 30 * minWorkDays / (minWorkDays + minRelaxDays) * salaryFrom;
        monthlySalaryTo = 30 * maxWorkDays / (maxWorkDays + maxRelaxDays) * salaryTo;
    }

    if (salaryPeriod === 'HOUR') {
        monthlySalaryFrom = 30*minWorkDays/(minWorkDays+minRelaxDays)*minWorkHours*salaryFrom;
        monthlySalaryTo = 30*maxWorkDays/(maxWorkDays+maxRelaxDays)*maxWorkHours*salaryTo;
    }

    if (salaryPeriod === 'FIFO') {
        monthlySalaryFrom = 30 * salaryFrom / parseInt(fifoDays)
    }

    console.log('salaryFrom: ', salaryFrom)
    console.log('salaryTo: ', salaryTo)
    console.log('salaryPeriod: ', salaryPeriod)
    console.log('schedule: ', schedule)
    console.log('workDays: ', workDays)
    console.log('relaxDays: ', relaxDays)
    console.log('workHours: ', workHours)
    console.log('monthlySalaryFrom: ', formatSalary(monthlySalaryFrom))
    console.log('monthlySalaryTo: ', formatSalary(monthlySalaryTo))
    console.log('==============================')

    monthlySalaryNode.innerHTML = `от ${formatSalary(monthlySalaryFrom)} до ${formatSalary(monthlySalaryTo)}`;
});


