import React, {useEffect} from "react";
import * as d3 from "d3";
import {getEmitHelpers} from "typescript";

export type Area = {
    label: string;
};

type CalendarProps = {
    area_name: Area | null;
};

type Data = {
    area_name: string;
    start: Date;
    finsh: Date;
};

export function Calendar({area_name}: CalendarProps) {
    const [csv, setCsv] = React.useState<string | undefined>();
    fetch('./machine_friendly.csv')
        .then(response => response.text())
        .then(responseText => {
            setCsv(responseText);
        });

    useEffect(() => {
        if (typeof csv === "undefined") {
            return;
        }
        const vals = csv!.split("\n").map(line => line.split(","));
        const sched = vals.filter(val => {
            return val[0] === area_name?.label.replace(" ", "-")
        }).map(sch => {
            return ({
                area_name: sch[0],
                start: new Date(sch[1]),
                finsh: new Date(sch[2]),
            })
        });
        console.table(sched);
        let newsched = [];
        let getMidnight = (date: Date) => {
            return new Date(
                date.getTime()
                - date.getHours() * 60 * 60 * 1000
                - date.getMinutes() * 60 * 1000
                - date.getSeconds() * 1000
                - date.getMilliseconds()
            );
        }
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        for (let i = 0; i < sched.length; i++) {
            // if the loadshedding event goes over midnight
            const diff = sched[i].finsh.getTime() - sched[i].start.getTime();
            for (let d = 0; d < diff + MS_PER_DAY; d += MS_PER_DAY) {
                let curr_midnight = getMidnight(new Date(sched[i].start.getTime() + d))
                if (curr_midnight > sched[i].finsh) {
                    break;
                }

                let start = new Date(Math.max(
                    sched[i].start.getTime(),
                    curr_midnight.getTime(),
                ))
                let finsh = new Date(Math.min(
                    sched[i].finsh.getTime(),
                    curr_midnight.getTime() + MS_PER_DAY - (60 * 1000),
                ))
                newsched.push({
                    area_name: sched[i].area_name,
                    start: start,
                    finsh: finsh,
                    group: i,
                })
            }
        }
        console.table(newsched);

        d3.select("div#area>div").remove()
        const svg = d3.select("div#area")
            .append("div")
            // Container class to make it responsive.
            .classed("svg-container", true)
            .append("svg")
            // Responsive SVG needs these 2 attributes and no width and height attr.
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 800 800")
            // Class to make it responsive.
            .classed("svg-content-responsive", true)
        let {bottom, height, left, right, top, width, x, y} =
            document.getElementById("area")?.getBoundingClientRect()!;
        const margins = {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10,
        }
        const padding = {inter_day: 1, }
        const width_per_day = width / 5
        const height_per_day = height / 24

        let min_date = d3.min(newsched.map(d => d.start))!;
        let padZeros = (s: any) => String(s).padStart(2, "0");
        let xScale = (time: Date) => {

            let diff_ms = getMidnight(time).getTime() - getMidnight(min_date).getTime()
            console.log(time, min_date, diff_ms / MS_PER_DAY);
            return diff_ms / MS_PER_DAY * width_per_day;
        }
        let yScale = (time: Date) => time.getHours() * height_per_day + time.getMinutes() * (height_per_day / 60)
        let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        let fmtTime = (time: Date) => {
            return days[time.getDay()]
                + " "
                + padZeros(time.getHours())
                + ":" + padZeros(time.getMinutes());
        }
        let textScale = (d: Data) => {
            return fmtTime(d.start) + " - " + fmtTime(d.finsh)
        }

        svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("opacity", "0.1")

        let sel = svg.selectAll("g")
            .data(newsched)
            .enter()
            .append("g")
            .attr("class", "timeslot");

        sel.append("rect")
            .attr("x", d => xScale(d.start))
            .attr("y", d => yScale(d.start))
            .attr("width", d => width_per_day)
            .attr("height", d => (yScale(d.finsh) - yScale(d.start)))

        sel.append("text")
            .text(d => "" + textScale(d))
            .attr("x", d => xScale(d.start))
            .attr("y", d => yScale(d.start))
            .attr("dy", "1em")

    }, [area_name, csv]);
    return (
        <div id="area"></div>
    );
}

