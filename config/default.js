module.exports={
	part:8080,
	session:{
		secret:'xiaomai',
		key:'xiaomai',
		maxAge:1000*60*60*24*30
	},
	mysql:{
		host     : 'rm-2ze4tk0u850c64o60o.mysql.rds.aliyuncs.com',
		user     : 'dbuser4test_dsxm',
		password : 'dbuser4test_dsxm_20171014',
		port:'3306',
		database : 'ts_xiaomai',
        charset:'UTF8MB4_GENERAL_CI'
	/*	schema: {
			tableName: 'custom_sessions_table_name',
			columnNames: {
				session_id: 'custom_session_id',
				expires: 'custom_expires_column_name',
				data: 'custom_data_column_name'
			}}*/
	}
};
