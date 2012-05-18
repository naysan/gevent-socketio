# -*- coding: utf-8 -*- 
<%inherit file="layout.mako"/>

<h2>Chat Prototype</h2>

<p>Log in or sign in </p>

<form action="${request.route_url('list')}" method="post">

  <input type="text" 	maxlength="100" name="name">
  <br/><br/>
  <input type="password" maxlength="100" name="passwd">
  <br/><br/>
  <input type="submit" name="add" value="GO" class="button">
  
</form>


