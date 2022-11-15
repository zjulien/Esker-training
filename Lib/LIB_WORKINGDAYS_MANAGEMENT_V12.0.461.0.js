///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_WorkingDays_Management_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Working Days Management library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Array",
    "[Sys/Sys_GenericAPI_Client]",
    "[Sys/Sys_GenericAPI_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var WorkingDays;
    (function (WorkingDays) {
        var Management;
        (function (Management) {
            var RecurrenceType;
            (function (RecurrenceType) {
                RecurrenceType["Yearly"] = "Yearly";
                RecurrenceType["Monthly"] = "Monthly";
                RecurrenceType["Weekly"] = "Weekly";
                RecurrenceType["Daily"] = "Daily";
            })(RecurrenceType = Management.RecurrenceType || (Management.RecurrenceType = {}));
            var DateType;
            (function (DateType) {
                DateType[DateType["OnDate"] = 1] = "OnDate";
                DateType[DateType["OnThe"] = 2] = "OnThe";
            })(DateType = Management.DateType || (Management.DateType = {}));
            var RangeType;
            (function (RangeType) {
                RangeType[RangeType["NoEndDate"] = 1] = "NoEndDate";
                RangeType[RangeType["EndAfter"] = 2] = "EndAfter";
                RangeType[RangeType["EndBy"] = 3] = "EndBy";
            })(RangeType = Management.RangeType || (Management.RangeType = {}));
            function setDayYearly(date, dayOff) {
                if (dayOff.dateType == DateType.OnDate) {
                    date.setMonth(dayOff.month);
                    date.setDate(dayOff.day);
                }
                else {
                    var distance = void 0;
                    if (dayOff.rank > 0) {
                        date.setMonth(dayOff.month);
                        date.setDate(1);
                        distance = dayOff.week - date.getDay();
                        if (distance < 0) {
                            distance += 7;
                        }
                        distance += (dayOff.rank - 1) * 7;
                    }
                    else {
                        date.setMonth(dayOff.month + 1);
                        date.setDate(0);
                        distance = dayOff.week - date.getDay();
                        if (distance > 0) {
                            distance -= 7;
                        }
                    }
                    date.setDate(date.getDate() + distance);
                }
            }
            function setDayMonthly(date, dayOff) {
                if (dayOff.dateType == DateType.OnDate) {
                    var month = date.getMonth();
                    date.setDate(dayOff.day);
                    if (date.getMonth() > month) {
                        date.setDate(0);
                    }
                }
                else {
                    var distance = void 0;
                    if (dayOff.rank > 0) {
                        date.setDate(1);
                        distance = dayOff.week - date.getDay();
                        if (distance < 0) {
                            distance += 7;
                        }
                        distance += (dayOff.rank - 1) * 7;
                    }
                    else {
                        date.setMonth(date.getMonth() + 1);
                        date.setDate(0);
                        distance = dayOff.week - date.getDay();
                        if (distance > 0) {
                            distance -= 7;
                        }
                    }
                    date.setDate(date.getDate() + distance);
                }
            }
            var gDaysOffFunc = {
                "Yearly": {
                    // for dayOff.rangetype == RangeType.EndAfter
                    computeEndDate: function (dayOff) {
                        var occurrence = dayOff.endAfterOccurrence;
                        var endDate = new Date(dayOff.startDate.toString());
                        setDayYearly(endDate, dayOff);
                        if (endDate >= dayOff.startDate) {
                            occurrence--;
                        }
                        endDate.setFullYear(endDate.getFullYear() + occurrence * dayOff.recurEvery);
                        if (dayOff.dateType == DateType.OnThe) {
                            setDayYearly(endDate, dayOff);
                        }
                        return endDate;
                    },
                    isDayOff: function (dayOff, date) {
                        if (dayOff.recurEvery > 1) {
                            var startDate = new Date(dayOff.startDate.toString());
                            setDayYearly(startDate, dayOff);
                            var startYear = startDate.getFullYear();
                            if (startDate < dayOff.startDate) {
                                startYear++;
                            }
                            if ((date.getFullYear() - startYear) % dayOff.recurEvery !== 0) {
                                return false;
                            }
                        }
                        var date2 = new Date(date.toString());
                        setDayYearly(date2, dayOff);
                        return date2 == date;
                    }
                },
                "Monthly": {
                    computeEndDate: function (dayOff) {
                        var occurrence = dayOff.endAfterOccurrence;
                        var endDate = new Date(dayOff.startDate.toString());
                        setDayMonthly(endDate, dayOff);
                        if (endDate >= dayOff.startDate) {
                            occurrence--;
                        }
                        var month = endDate.getMonth() + occurrence * dayOff.recurEvery;
                        endDate.setMonth(month);
                        if (endDate.getMonth() != month) {
                            endDate.setDate(0);
                        }
                        setDayMonthly(endDate, dayOff);
                        return endDate;
                    },
                    isDayOff: function (dayOff, date) {
                        if (dayOff.recurEvery > 1) {
                            var startDate = new Date(dayOff.startDate.toString());
                            setDayMonthly(startDate, dayOff);
                            var startMonth = startDate.getMonth();
                            if (startDate < dayOff.startDate) {
                                startMonth++;
                            }
                            if ((date.getMonth() - startMonth) % dayOff.recurEvery !== 0) {
                                return false;
                            }
                        }
                        var date2 = new Date(date.toString());
                        setDayMonthly(date2, dayOff);
                        return date2 == date;
                    }
                },
                "Weekly": {
                    computeEndDate: function (dayOff) {
                        if (dayOff.weeks.length == 0) {
                            return null;
                        }
                        var occurrence = dayOff.endAfterOccurrence;
                        var endDate = new Date(dayOff.startDate.toString());
                        var day = endDate.getDay();
                        // find the first day off after endDate.getDay()
                        var firstDay;
                        for (firstDay = 0; firstDay < dayOff.weeks.length; firstDay++) {
                            if (dayOff.weeks[firstDay] >= day) {
                                break;
                            }
                        }
                        var distance;
                        if (firstDay >= dayOff.weeks.length) {
                            // no day off in the first week ->	first day off of the next week
                            distance = 7 + dayOff.weeks[0] - day;
                        }
                        else {
                            var nFirstWeek = dayOff.weeks.length - firstDay;
                            if (nFirstWeek >= occurrence) {
                                distance = dayOff.weeks[firstDay + occurrence - 1] - day;
                                nFirstWeek = occurrence;
                            }
                            else {
                                distance = 7 - day;
                            }
                            occurrence -= nFirstWeek;
                        }
                        if (occurrence > 0) {
                            var nLastWeek = occurrence % dayOff.weeks.length;
                            if (nLastWeek == 0) {
                                nLastWeek = dayOff.weeks.length;
                            }
                            occurrence -= nLastWeek;
                            var nWeeks = occurrence / dayOff.weeks.length * dayOff.recurEvery;
                            distance += (nWeeks + dayOff.recurEvery - 1) * 7 + dayOff.weeks[nLastWeek - 1];
                        }
                        endDate.setDate(endDate.getDate() + distance);
                        return endDate;
                    },
                    isDayOff: function (dayOff, date) {
                        if (dayOff.recurEvery > 1) {
                            var startDate = new Date(dayOff.startDate.toString());
                            var weeks = Math.floor((date.getTime() - startDate.getTime()) / 86400000 / 7);
                            var startDay_1 = startDate.getDay();
                            if (Sys.Helpers.IsUndefined(Sys.Helpers.Array.Find(dayOff.weeks, function (week) {
                                return week >= startDay_1;
                            }))) {
                                // the first occurrence starts on the next week
                                weeks--;
                            }
                            if (weeks % dayOff.recurEvery !== 0) {
                                return false;
                            }
                        }
                        var day = date.getDay();
                        return Sys.Helpers.IsDefined(Sys.Helpers.Array.Find(dayOff.weeks, function (week) {
                            return week == day;
                        }));
                    }
                },
                "Daily": {
                    computeEndDate: function (dayOff) {
                        var occurrence = dayOff.endAfterOccurrence;
                        var endDate = new Date(dayOff.startDate.toString());
                        occurrence--;
                        endDate.setDate(endDate.getDate() + occurrence * dayOff.recurEvery);
                        return endDate;
                    },
                    isDayOff: function (dayOff, date) {
                        if (dayOff.recurEvery > 1) {
                            var startDate = new Date(dayOff.startDate.toString());
                            startDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
                            var days = Math.round((date.getTime() - startDate.getTime()) / 86400000);
                            return days % dayOff.recurEvery === 0;
                        }
                        return true;
                    }
                }
            };
            function LoadWorkingDaysByMSN(msn) {
                return LoadWorkingDays("(MSN=" + msn + ")");
            }
            Management.LoadWorkingDaysByMSN = LoadWorkingDaysByMSN;
            function LoadWorkingDaysByName(name) {
                return LoadWorkingDays("(ConfigName__=" + name + ")");
            }
            Management.LoadWorkingDaysByName = LoadWorkingDaysByName;
            function LoadWorkingDays(filter) {
                Log.Info("Load working days table, filter: " + filter);
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var options = {
                        table: "WorkingDays__",
                        filter: filter,
                        attributes: ["*"]
                    };
                    Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (queryResults) {
                        var result = queryResults[0];
                        var workingDays = {
                            name: result.CONFIGNAME__,
                            description: result.CONFIGDESCRIPTION__,
                            weekDays: [],
                            daysOff: []
                        };
                        for (var i = 0; i < 7; i++) {
                            workingDays.weekDays[i] = Sys.Helpers.String.ToBoolean(result["WEEKDAY" + i + "__"]);
                        }
                        if (result.JSONDAYSOFF__) {
                            // "2020-12-31T12:00:00.000Z" or "2020-12-01T09:28:56.321-10:00"
                            var dateFormat_1 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
                            workingDays.daysOff = JSON.parse(result.JSONDAYSOFF__, function (key, value) {
                                return Sys.Helpers.IsString(value) && dateFormat_1.test(value) ? new Date(value) : value;
                            });
                        }
                        resolve(workingDays);
                    })
                        .Catch(function (e) {
                        Log.Error("Error quering Working days table: " + e);
                        reject("Error quering Working days table: " + e);
                    });
                });
            }
            function ComputeEndDate(dayOff) {
                if (dayOff.rangeType == RangeType.EndBy) {
                    return dayOff.endDate;
                }
                if (dayOff.rangeType == RangeType.EndAfter) {
                    if (dayOff.startDate) {
                        return gDaysOffFunc[dayOff.type].computeEndDate(dayOff);
                    }
                }
                return null;
            }
            Management.ComputeEndDate = ComputeEndDate;
            function ComputeFirstOccurrenceDate(dayOff) {
                if (dayOff.startDate) {
                    var savedEndAfterOccurrence = dayOff.endAfterOccurrence;
                    dayOff.endAfterOccurrence = 1;
                    var firstDate = gDaysOffFunc[dayOff.type].computeEndDate(dayOff);
                    dayOff.endAfterOccurrence = savedEndAfterOccurrence;
                    return firstDate;
                }
                return null;
            }
            Management.ComputeFirstOccurrenceDate = ComputeFirstOccurrenceDate;
            function IsInRange(dayOff, date) {
                if (dayOff.startDate && dayOff.startDate > date) {
                    return false;
                }
                var endDate = ComputeEndDate(dayOff);
                return !endDate || endDate >= date;
            }
            function IsWorkingDay(workingDays, date) {
                // if not in Working days -> false
                var day = date.getDay();
                if (!workingDays.weekDays[day]) {
                    return false;
                }
                // if not in Days off -> true
                return !Sys.Helpers.Array.Find(workingDays.daysOff, function (dayOff) {
                    return IsInRange(dayOff, date) && gDaysOffFunc[dayOff.type].isDayOff(dayOff, date);
                });
            }
            Management.IsWorkingDay = IsWorkingDay;
        })(Management = WorkingDays.Management || (WorkingDays.Management = {}));
    })(WorkingDays = Lib.WorkingDays || (Lib.WorkingDays = {}));
})(Lib || (Lib = {}));
