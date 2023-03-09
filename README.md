![Scavenger Hunt banner](https://media.roboflow.com/shareimg/roboflow-scavhunt-share-text.png?ik-sdk-version=javascript-1.4.3&updatedAt=1677797874103)

<div align="center">
    <a href="https://youtube.com/roboflow">
        <img
        src="https://media.roboflow.com/notebooks/template/icons/purple/youtube.png?ik-sdk-version=javascript-1.4.3&updatedAt=1672949634652"
        width="3%"
        />
    </a>
    <img src="https://github.com/SkalskiP/SkalskiP/blob/master/icons/transparent.png" width="3%"/>
    <a href="https://roboflow.com">
        <img
        src="https://media.roboflow.com/notebooks/template/icons/purple/roboflow-app.png?ik-sdk-version=javascript-1.4.3&updatedAt=1672949746649"
        width="3%"
        />
    </a>
    <img src="https://github.com/SkalskiP/SkalskiP/blob/master/icons/transparent.png" width="3%"/>
    <a href="https://www.linkedin.com/company/roboflow-ai/">
        <img
        src="https://media.roboflow.com/notebooks/template/icons/purple/linkedin.png?ik-sdk-version=javascript-1.4.3&updatedAt=1672949633691"
        width="3%"
        />
    </a>
    <img src="https://github.com/SkalskiP/SkalskiP/blob/master/icons/transparent.png" width="3%"/>
    <a href="https://docs.roboflow.com">
        <img
        src="https://media.roboflow.com/notebooks/template/icons/purple/knowledge.png?ik-sdk-version=javascript-1.4.3&updatedAt=1672949634511"
        width="3%"
        />
    </a>
    <img src="https://github.com/SkalskiP/SkalskiP/blob/master/icons/transparent.png" width="3%"/>
    <a href="https://disuss.roboflow.com">
        <img
        src="https://media.roboflow.com/notebooks/template/icons/purple/forum.png?ik-sdk-version=javascript-1.4.3&updatedAt=1672949633584"
        width="3%"
        />
    <img src="https://github.com/SkalskiP/SkalskiP/blob/master/icons/transparent.png" width="3%"/>
    <a href="https://blog.roboflow.com">
        <img
        src="https://media.roboflow.com/notebooks/template/icons/purple/blog.png?ik-sdk-version=javascript-1.4.3&updatedAt=1672949633605"
        width="3%"
        />
    </a>
    </a>
</div>

# SXSW + Roboflow Scavenger Hunt

This repository contains the code for the scavenger hunt run by Roboflow in celebration of SXSW 2023.

In this scavenger hunt, event participants are tasked with identifying five objects from the Microsoft COCO dataset. After identifying five objects, players are prompted with five more to identify. For every five objects identified, players are given an additional ticket to enter a contest to win $1,000.

This repository contains the source code for the application.

![Screenshot](screenshot.png)

## Technologies Used

- [Supabase](https://supabase.io)
- [Node.js](https://nodejs.org/en/)
- [Express.js](https://expressjs.com/)
- [roboflow.js](https://docs.roboflow.com/inference/web-browser)

## Getting Started

To get started, you will need a Supabase account with three tables. The schema for these tables is in the `schema.sql` file in this repository. This schema file was generated using the following command:

```
pg_dump -h SUPABASE_DATABASE_URL -U postgres --data-only -n public -n auth > supabase_data.sql
```

You can ingest it into your Supabase project using the following command:

```
psql -f schema.sql -p PORT -U USERNAME DATABASE_NAME -h SUPABASE_DATABASE_URL
```

When you have the requisite tables, export the URL and key for your Supabase project as environment variables, as well as the port on which you want the application to run.

```
export SUPABASE_URL=""
export SUPABASE_KEY=""
export PORT=8080
```

Then, install the required dependencies:

```
npm install
```

Finally, run the application using Node:

```
node app.js
```

## License

This project is licensed under an [MIT license](LICENSE).