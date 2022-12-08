import React, {useEffect} from "react";
import * as d3 from "d3";
import {Octokit} from "@octokit/core";

export type Area = {
    label: string;
};

type CalendarProps = {
    area_name: Area | null;
};


export function Calendar({area_name}: CalendarProps) {
    // const octokit = new Octokit({})
    // // List all releases
    // const owner = 'beyarkay';
    // const repo = 'eskom-calendar';
    // octokit.request(`GET /repos/${owner}/${repo}/releases`, {
    //     owner, repo
    // }).then((res) => {
    //     const release = res['data'].filter((e: any) => { return e['tag_name'] === 'latest'; })[0];
    //     const assets = release['assets'];
    //     const csv = assets.filter((e: any) => e['name'] === 'machine_friendly.csv')[0]
    //     console.log(csv)
    //     const asset_id = csv['id'];
    //     octokit.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
    //         owner,
    //         repo,
    //         asset_id
    //     }).then(asset => {
    //         console.log(asset);
    //     });
    // });

    fetch("https://cors-anywhere.herokuapp.com/https://github.com/beyarkay/eskom-calendar/releases/download/latest/machine_friendly.csv").then(res => {
        console.log(res['body']);
    });

    useEffect(() => {
        const svg = d3.select("#area");
        svg.selectAll("text").remove()
        svg
            .append("text")
            .text(area_name?.label ?? "no area")
            .attr("x", 100)
            .attr("y", 100)
            .style("fill", "grey");
    }, [area_name]);
    return (
        <svg id="area" height={200} width={450}></svg>
    );
}

