create table if not exists userimport (
    id varchar(45) not null,
    username varchar(45),
    email varchar(45),
    phone varchar(45),
    status varchar(45),
    createddate datetime,
    primary key (id)
);

create index idx_userimport_createddate on userimport(createddate);
/*
select * from userimport;
truncate table userimport;
*/