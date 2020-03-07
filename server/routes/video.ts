import Router from 'koa-router'
import SearchQueryBuilder from '../lib/SearchQueryBuilder'
import { MoreThan } from 'typeorm'
import dayjs from 'dayjs'
import yn from 'yn'

import { Video } from '../../database/entity/Video'
import { VideoStat } from './../../database/entity/VideoStat'
import { VideoMeta } from './../../database/entity/VideoMeta'
import { VideoStatus } from './../../database/entity/type/VideoStatus'
import { VideoType } from './../../database/entity/type/VideoType'

const router = new Router()
router.get('/', async (ctx, next) => {
  const fulltext = yn(ctx.query.fulltext)
  const searchColumn = ['key', 'title', 'channel.title']
  if (fulltext) searchColumn.push('description')

  const { query, page, size } = SearchQueryBuilder.builder(ctx.query, Video, 'video')
    .search('text', searchColumn)
    .equal('channel', 'channelId')
    .enum('type', VideoType)
    .enum('status', VideoStatus)
    .untilDatetime('end', 'startTime')
    .sinceDatetime('start', 'endTime')
    .pagination()
    .leftJoinAndSelect('video.channel', 'channel')
    .build()

  const { 0: items, 1: count } = await query.getManyAndCount()
  ctx.body = {
    items: items,
    length: size,
    totalLength: count,
    page: page,
    totalPages: Math.ceil(count / size)
  }
})

router.get('/:id', async (ctx, next) => {
  const { query } = SearchQueryBuilder.builder(ctx.query, Video, 'video')
    .equalRaw('id', ctx.params.id)
    .leftJoinAndSelect('video.channel', 'channel')
    .build()

  const item = await query.getOne()
  ctx.body = item
})

router.get('/:id/metas', async (ctx, next) => {
  const start = dayjs().subtract(7, 'day').toDate()
  const metas = await VideoMeta.find({
    videoId: ctx.params.id,
    createdAt: MoreThan(start)
  })
  ctx.body = metas
})

router.get('/:id/stats', async (ctx, next) => {
  const start = dayjs().subtract(7, 'day').toDate()
  const stats = await VideoStat.find({
    videoId: ctx.params.id,
    createdAt: MoreThan(start)
  })
  ctx.body = stats
})

export default router
