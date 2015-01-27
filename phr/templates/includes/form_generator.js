frappe.provide("templates/includes");
{% include "templates/includes/utils.js" %}
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.min.js");
frappe.require("assets/frappe/js/lib/jquery/bootstrap_theme/jquery-ui.selected.css");
frappe.require("assets/frappe/js/lib/jquery/bootstrap_theme/jquery-ui.css");
frappe.provide("assets/frappe/js/lib/jquery/bootstrap_theme/images");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.slider.min.js");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.sliderAccess.js");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.timepicker-addon.css");
frappe.require("assets/frappe/js/lib/jquery/jquery.ui.timepicker-addon.js");

var RenderFormFields = function(){
	this.wrapper = ""
}

$.extend(RenderFormFields.prototype,{
	init:function(wrapper, arg, entityid, operation, modal_wrapper){
		//initializing
		this.section = '';
		this.column = '';
		this.args = arg;
		this.entityid=entityid;
		this.operation=operation;
		console.log(['modal_wrapper', modal_wrapper])

		if(modal_wrapper) this.wrapper = modal_wrapper.find('.modal-body');
		else this.wrapper =  $('.field-area');
		this.result_set = {}
		this.visibility_dict = {}
		this.labelled_section_count = 0;
		console.log(this.entityid)

		//crear rendering area
		$(this.wrapper).empty()

		//initiate rendering
		this.render_top()
		this.get_field_meta();

	},
	render_top:function(){
		var me = this;
		$('.new_controller').remove();
		$('.save_controller').remove();

		$('<div class="save_controller" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					<i class="icon-save"></i> Save \
				</button>\
			</div>').appendTo($('.sub-top-bar')).addClass(me.operation)
			

	},
	get_field_meta:function(){
		var me = this;
		var arg = {};
		
		if(me.args){
			arg['data'] = JSON.stringify(me.args)
		}
		if(me.entityid){
			arg['entityid'] = me.entityid
		}


		console.log(['form_generator', arg])

		$.ajax({
			method: "GET",
			url: "/api/method/phr.templates.pages.patient.get_data_to_render",
			data: arg,
			async: false,
			success: function(r) {
				me.render_fields(r.message[0], r.message[1],r.message[2])
			}
		});
	},
	render_fields:function(fields, values, tab){
		var me = this;
		if(tab==1) me.tab_field_renderer()
		$.each(fields,function(indx, meta){
			!me.section && meta['fieldtype'] !== 'section_break' && me.section_break_field_renderer()
			!me.column && me.column_break_field_renderer()
			console.log([values[meta['fieldname']], meta['fieldname'] , meta['fieldtype']])
			meta['value']=values[meta['fieldname']] || "";
			me[meta['fieldtype'] + "_field_renderer"].call(me, meta);
			if(meta['depends_on']) me.depends_on(meta)
		})
	
	},
	check_field_renderer: function(field_meta){
		var me=this;
		$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
								<div class="col-xs-8">\
								<div class="control-input">\
									<input type="checkbox" class="chk" name="%(fieldname)s" value="%(fieldname)s">\
									%(label)s\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
		if(field_meta['required']==1){
			$input.find("input").prop('required',true)
			$input.find("input").css({"border": "1px solid #999","border-color": "red" });
		}
	},
	depends_on:function(meta){
		parent_field = meta['depends_on'].split(':')[0]

		if(this.visibility_dict[parent_field]) this.set_dict_param(parent_field, meta)
		else{
			this.visibility_dict[parent_field] = {}
			this.set_dict_param(parent_field, meta)	
		}
		this.add_onchange_event(parent_field)
		
	},
	set_dict_param:function(parent_field, meta){
		if(!this.visibility_dict[parent_field][meta['depends_on'].split(':')[1]]){
			this.visibility_dict[parent_field][meta['depends_on'].split(':')[1]] = []
		} 
		this.visibility_dict[parent_field][meta['depends_on'].split(':')[1]].push(meta['fieldname'])
		$($('[name="'+meta['fieldname']+'"]').parents()[3]).css("display", "none");		
	},
	add_onchange_event:function(parent_field){
		var me = this;
		$('[name="'+parent_field+'"]').on('change', function(){
			me.visibility_setter($(this).attr('name'), $(this).val(), me.visibility_dict)
		})
	},
	visibility_setter:function(parent, val, dict_of_fileds){
		$.each(dict_of_fileds[parent], function(key, filed_list){
			$.each(filed_list, function(i,field){
				if(key == val) $($('[name="'+field+'"]').parents()[3]).css("display", "inherit");
				else $($('[name="'+field+'"]').parents()[3]).css("display", "none");
			})	
		})
	},
	set_description:function(area, meta){
		if(meta['description']){
			$('<p class="text-muted small">' + meta['description'] + '</p>')
				.appendTo(area);	
		}
	},
	data_field_renderer: function(field_meta){
		var me=this;
		$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(label)s" name="%(fieldname)s" value="%(value)s" \
										aria-describedby="basic-addon2">\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
		if(field_meta['required']==1){
			$input.find("input").prop('required',true)
			$input.find("input").css({"border": "1px solid #999","border-color": "red" });
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	select_field_renderer: function(field_meta){
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<select type="text" class="form-control" \
										name="%(fieldname)s" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
		
		$.each(field_meta['options'],function(i, val){
				$option=$('<option>', { 
					'value': val,
					'text' : val 
				}).appendTo($($input.find('select')))
				if (field_meta['value']==val){
				 $option.attr('selected','selected')
				}
				$option.appendTo($($input.find('select')))
		})
		if(field_meta['required']==1){
			$input.find("select").prop('required',true)
			$input.find("select").css({"border": "1px solid #999","border-color": "red" });
		}

		this.set_description($input.find('.control-input'), field_meta)

	},
	link_field_renderer: function(field_meta){
		var me = this;
		var $input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control autocomplete" \
										placeholder="%(label)s" name="%(fieldname)s" value="%(value)s" \
										aria-describedby="basic-addon2" style="width:150px;">\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		frappe.require("/assets/phr/js/jquery.autocomplete.multiselect.js");
		if (typeof(field_meta['options']) === "string"){
			frappe.call({
				method:'phr.templates.pages.patient.get_master_details',
				args:{'doctype': field_meta['options']},
				callback: function(r){
					$($input.find('.autocomplete')).autocomplete({
						source: r.message,
						multiselect: field_meta['multiselect'] == "false" ? false:true
					});
				}
			})
		}
		
		else{
			console.log($input.find('.autocomplete'))
			$($input.find('.autocomplete')).autocomplete({
				source: field_meta['options'],
				multiselect: field_meta['multiselect']
			});
		}
		if(field_meta['required']==1){
			$input.find("input").prop('required',true)
			$input.find("input").css({"border": "1px solid #999","border-color": "red" });
		}

		this.set_description($input.find('.control-input'), field_meta)

		// $($input.find('.autocomplete')).autocomplete({
  //       source: function(request, response){
  //           var matcher = new RegExp( $.ui.autocomplete.escapeRegex( request.term ), "i" );
  //           response( $.grep( field_meta['options'], function( value ) {
  //           return matcher.test(value['constructor']) || matcher.test(value.model) || matcher.test(value.type);
  //       }));
  //       }
    // });
	},
	text_field_renderer: function(field_meta){
		var me = this;
		$input=$(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<textarea type="text" class="form-control" \
										placeholder="%(label)s" name="%(fieldname)s"\
										aria-describedby="basic-addon2"></textarea>\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))
		$input.find("textarea").val(field_meta['value'])
		if(field_meta['required']==1){
			$input.find("textarea").prop('required',true)
			$input.find("textarea").css({"border": "1px solid #999","border-color": "red" });
		}

		if(field_meta['display']){
			$($('[name="'+field_meta['fieldname']+'"]').parents()[3]).css("display", field_meta['display']);
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	button_field_renderer: function(field_meta){
		$('<div class="update" style="width:45%;display:inline-block;text-align:right;">\
				<button class="btn btn-primary">\
					Save \
				</button>\
			</div>').appendTo($(this.column))

	},
	attach_field_renderer:function(field_meta){
		$('<div class="fileinput fileinput-exists" data-provides="fileinput">\
			<div class="fileinput-new thumbnail" style="width: 200px; height: 150px;">\
			 <img data-src="holder.js/100%x100%" alt="...">\
			 </div>\
			 <div class="fileinput-preview fileinput-exists thumbnail" style="max-width: 200px; max-height: 150px;"></div>\
            <div><span class="btn btn-default btn-file"><span class="fileinput-new">Select image</span>\
            <span class="fileinput-exists">Change</span>\
            <input type="file" name="..."></span>\
 			 <a href="#" class="btn btn-default fileinput-exists" data-dismiss="fileinput">Remove</a>\
 			 </div>\
 			</div>').appendTo($(this.column))
		/*$('.fileinput').fileinput()*/
	},
	date_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(label)s" name="%(fieldname)s" data-fieldtype="Date" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		$( $input.find('[data-fieldtype="Date"]' )).datepicker({
						altFormat:'yy-mm-dd',
						changeYear: true,
						yearRange: "-70Y:+10Y",
						dateFormat: "dd/mm/yy"
					})
			var val = field_meta['value'];
			if(val){
			var date=new Date(val)
			$input.find('input').val($.datepicker.formatDate('dd/mm/yy',date))
			}
	
		if(field_meta['required']==1){
			$input.find("input").prop('required',true);
			$input.find("input").css({"border": "1px solid #999","border-color": "red" });
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	datetime_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="form-horizontal frappe-control" style="max-width: 600px;margin-top:10px;">\
						<div class="form-group row" style="margin: 0px">\
							<label class="control-label small col-xs-4" style="padding-right: 0px;">%(label)s</label>\
							<div class="col-xs-8">\
								<div class="control-input">\
									<input type="text" class="form-control" \
										placeholder="%(label)s" name="%(fieldname)s" data-fieldtype="Date" >\
								</div>\
							</div>\
						</div>\
				</div>', field_meta)).appendTo($(this.column))

		$( $input.find('[data-fieldtype="Date"]' )).datetimepicker({
						altFormat:'yy-mm-dd',
						changeYear: true,
						yearRange: "-70Y:+10Y",
						dateFormat: "dd/mm/yy",
						timeFormat:  "HH:mm:ss"
					})
		var val = field_meta['value'];
		
		if(val){
			var date=new Date(val)
			$input.find('input').val($.datetimepicker.formatDate('dd/mm/yy',date))
		}

		if(field_meta['required']==1){
			$input.find("input").prop('required',true);
			$input.find("input").css({"border": "1px solid #999","border-color": "red" });
		}

		this.set_description($input.find('.control-input'), field_meta)
	},
	table_field_renderer:function(field_meta){
		var me = this;
		$input = $(repl_str('<div class="panel panel-primary" style="height:100%;margin-top:10px;">\
				<div class="panel-heading">%(label)s</div>\
				<div class="panel-body" style="padding:1px;height: 25%;;overflow:hidden;overflow:auto">\
					<table class="table table-striped" data-pagination="true"  style="padding=0px;" >\
						<thead><tr></tr></thead>\
						<tbody></tbody>\
					</table>\
				</div>\
			</div>',field_meta)).appendTo($(this.column))

		$.each(field_meta['rows'],function(i, val){
			(i==0) ? me.render_table_heads(val, $input) : me.render_table_body(val, $input)
		})

	},
	render_table_heads:function(val, input_area){
		$.each(val,function(i, d){
			$("<th>").html(d)
				.appendTo($(input_area).find("thead tr"));
		})
	},
	render_table_body:function(val, input_area){
		var row = $("<tr>").appendTo($(input_area).find("tbody"));
		$.each(val,function(i, d){
			$("<td>").html(d)
				.appendTo(row);
		})
	},
	tab_field_renderer: function(){
		$('<div role="tabpanel">\
				<ul class="nav nav-tabs tab-ui" role="tablist"></ul>\
				<div class="tab-content tab-div"></div>\
			</div>').appendTo($(this.wrapper))

	},
	section_field_renderer: function(field_meta){
		if(field_meta['default']==1){
			$(repl_str('<li role="presentation" class="active">\
						<a href="#%(fieldname)s" aria-controls="%(fieldname)s"\
							role="tab" data-toggle="tab">%(label)s</a>\
					</li>',field_meta)).appendTo($(".tab-ui"))
	
			$(repl_str('<div role="tabpanel" class="tab-pane active" id="%(fieldname)s">\
			</div>',field_meta)).appendTo($(".tab-div"))
		}
		else{
			$(repl_str('<li role="presentation">\
						<a href="#%(fieldname)s" aria-controls="%(fieldname)s"\
							role="tab" data-toggle="tab">%(label)s</a>\
					</li>',field_meta)).appendTo($(".tab-ui"))
	
			$(repl_str('<div role="tabpanel" class="tab-pane " id="%(fieldname)s">\
			</div>',field_meta)).appendTo($(".tab-div"))
		}

		this.wrapper = $(repl_str("#%(fieldname)s",field_meta))
		this.section_break_field_renderer(field_meta);
		this.column_break_field_renderer();
	},
	column_break_field_renderer: function(field_meta){
        this.column = $('<div class="form-column" style="margin-top:10px;">\
            				<form>\
							</form>\
					</div>').appendTo($(this.section))
					.find("form")
					.on("submit", function() { return false; })
			   // distribute all columns equally
		var colspan = cint(12 / $(this.section).find(".form-column").length);
		$(this.section).find(".form-column").removeClass()
			.addClass("form-column")
			.addClass("col-md-" + colspan);
    },
    section_break_field_renderer: function(meta){
    	this.section = $('<div class="row sec" style="padding:2%""></div>')
    		.appendTo($(this.wrapper))
    		.css("border-top", "1px solid #eee")
    		.css("padding-top", "15px")
    	
    	if(meta){
    		if(meta['label']){
    			this.labelled_section_count++;
	    		var head = $('<h4 class="col-md-12">'
						+ (meta['options'] ? (' <i class="icon-fixed-width text-muted '+meta['options']+'"></i> ') : "")
						+ '<span class="section-count-label">' + __(this.labelled_section_count) + "</span>. "
						+ meta['label']
						+ "</h4>")
						.css({"margin":"15px 0px"})
						.appendTo(this.section);	
    		}	
    	}
    	
    	this.column = null;
    		
    }
})
